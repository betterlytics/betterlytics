'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Copy, ExternalLink, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { useDebounce } from '@/hooks/useDebounce';
import { LANGUAGE_METADATA, SUPPORTED_LANGUAGES, type SupportedLanguages } from '@/constants/i18n';
import {
  STATUS_PAGE_LIMITS,
  type StatusPagePreviewPayload,
  type StatusPageTheme,
  type StatusPageWithMonitors,
} from '@/entities/analytics/statusPage.entities';
import { ColorPickerPopover } from '@/components/ColorPickerPopover';
import { ColorSwatchPicker } from '@/components/ColorSwatchPicker';
import { LivePreview } from './LivePreview';
import {
  checkStatusPageSlugAction,
  setStatusPagePublishedAction,
  updateStatusPageAction,
} from '@/app/actions/analytics/statusPage.actions';

const ACCENT_PRESETS = ['#4845d8', '#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#0ea5e9'];

type MonitorRow = {
  monitorCheckId: string;
  name: string | null;
  url: string;
  included: boolean;
  publicName: string;
};

type StatusPageEditorProps = {
  dashboardId: string;
  statusPage: StatusPageWithMonitors;
  monitors: Array<{ id: string; name: string | null; url: string }>;
  publicBaseUrl: string;
  previewPayload: StatusPagePreviewPayload;
  previewMessages: Record<string, unknown>;
};

function buildMonitorRows(
  statusPage: StatusPageWithMonitors,
  monitors: StatusPageEditorProps['monitors'],
): MonitorRow[] {
  const selectionByMonitorId = new Map(statusPage.monitors.map((m) => [m.monitorCheckId, m]));
  const defaultName = (monitor: { name: string | null; url: string }) =>
    (monitor.name ?? new URL(monitor.url).hostname).slice(0, STATUS_PAGE_LIMITS.PUBLIC_NAME_MAX);

  return monitors
    .map((monitor) => {
      const selection = selectionByMonitorId.get(monitor.id);
      return {
        monitorCheckId: monitor.id,
        name: monitor.name,
        url: monitor.url,
        included: selection != null,
        publicName: selection?.publicName ?? defaultName(monitor),
      };
    })
    .sort((a, b) => {
      const positionA = selectionByMonitorId.get(a.monitorCheckId)?.position ?? Number.MAX_SAFE_INTEGER;
      const positionB = selectionByMonitorId.get(b.monitorCheckId)?.position ?? Number.MAX_SAFE_INTEGER;
      return positionA - positionB;
    });
}

export function StatusPageEditor({
  dashboardId,
  statusPage,
  monitors,
  publicBaseUrl,
  previewPayload,
  previewMessages,
}: StatusPageEditorProps) {
  const t = useTranslations('statusPagesPage.editor');
  const router = useRouter();

  const [name, setName] = useState(statusPage.name);
  const [slug, setSlug] = useState(statusPage.slug);
  const [theme, setTheme] = useState<StatusPageTheme>(statusPage.theme);
  const [accentColor, setAccentColor] = useState(statusPage.accentColor);
  const [language, setLanguage] = useState<SupportedLanguages>(statusPage.language);
  const [showPastIncidents, setShowPastIncidents] = useState(statusPage.showPastIncidents);
  const [homepageUrl, setHomepageUrl] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public');
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [monitorRows, setMonitorRows] = useState<MonitorRow[]>(() => buildMonitorRows(statusPage, monitors));
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  const payload = useMemo(
    () => ({
      id: statusPage.id,
      name: name.trim(),
      slug,
      theme,
      accentColor,
      language,
      showPastIncidents,
      monitors: monitorRows
        .filter((row) => row.included)
        .map((row) => ({ monitorCheckId: row.monitorCheckId, publicName: row.publicName.trim() })),
    }),
    [statusPage.id, name, slug, theme, accentColor, language, showPastIncidents, monitorRows],
  );

  const savedPayloadRef = useRef(JSON.stringify(payload));
  const isDirty = JSON.stringify(payload) !== savedPayloadRef.current;

  const saveMutation = useMutation({
    mutationFn: async () => updateStatusPageAction(dashboardId, payload),
    onSuccess: () => {
      savedPayloadRef.current = JSON.stringify(payload);
      router.refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const debouncedPayload = useDebounce(payload, 800);
  useEffect(() => {
    if (statusPage.isPublished || saveMutation.isPending) return;
    if (JSON.stringify(debouncedPayload) === savedPayloadRef.current) return;
    if (debouncedPayload.name.length === 0 || slugStatus === 'taken' || slugStatus === 'invalid') return;
    saveMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutate on settled draft changes only
  }, [debouncedPayload]);

  const publishMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      if (isDirty) await updateStatusPageAction(dashboardId, payload);
      return setStatusPagePublishedAction(dashboardId, statusPage.id, publish);
    },
    onSuccess: (updated) => {
      savedPayloadRef.current = JSON.stringify(payload);
      if (updated.isPublished) {
        setShowPublishSuccess(true);
      } else {
        toast.success(t('unpublished'));
      }
      router.refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const debouncedSlug = useDebounce(slug, 400);
  useEffect(() => {
    if (debouncedSlug === statusPage.slug) {
      setSlugStatus('idle');
      return;
    }
    let cancelled = false;
    setSlugStatus('checking');
    checkStatusPageSlugAction(dashboardId, debouncedSlug, statusPage.id).then((result) => {
      if (cancelled) return;
      setSlugStatus(result.available ? 'available' : result.reason === 'taken' ? 'taken' : 'invalid');
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedSlug, dashboardId, statusPage.id, statusPage.slug]);

  const moveRow = (index: number, direction: -1 | 1) => {
    setMonitorRows((rows) => {
      const target = index + direction;
      if (target < 0 || target >= rows.length) return rows;
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateRow = (index: number, patch: Partial<MonitorRow>) => {
    setMonitorRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const includedCount = monitorRows.filter((row) => row.included).length;
  const publicHost = publicBaseUrl.replace(/^https?:\/\//, '');
  const saveDisabled = !isDirty || payload.name.length === 0 || slugStatus === 'taken' || slugStatus === 'invalid';

  const slugStatusLabel =
    slugStatus === 'idle' ? null : (
      <span
        className={
          slugStatus === 'available'
            ? 'text-emerald-600 dark:text-emerald-400'
            : slugStatus === 'checking'
              ? 'text-muted-foreground'
              : 'text-destructive'
        }
      >
        {t(`slugStatus.${slugStatus}`)}
      </span>
    );

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <Link
            href={`/dashboard/${dashboardId}/monitoring/status-pages`}
            className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm'
          >
            <ArrowLeft className='h-3.5 w-3.5' />
            {t('back')}
          </Link>
          <h1 className='mt-1 text-xl font-bold'>{statusPage.name}</h1>
        </div>
        <div className='flex items-center gap-2'>
          <PermissionGate>
            {(disabled) => (
              <Button
                variant='outline'
                disabled={disabled || saveDisabled || saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate(undefined, { onSuccess: () => toast.success(t('saved')) })
                }
                className='cursor-pointer'
              >
                {t('save')}
              </Button>
            )}
          </PermissionGate>
          <PermissionGate>
            {(disabled) => (
              <Button
                disabled={disabled || publishMutation.isPending || (!statusPage.isPublished && saveDisabled && isDirty)}
                onClick={() => publishMutation.mutate(!statusPage.isPublished)}
                className='cursor-pointer'
              >
                {statusPage.isPublished ? t('unpublish') : t('publish')}
              </Button>
            )}
          </PermissionGate>
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start'>
        <div className='space-y-4'>
          <section className='bg-card border-border space-y-4 rounded-xl border p-5'>
            <h2 className='font-semibold'>{t('pageDetails')}</h2>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='sp-name'>{t('pageName')}</Label>
                <Input
                  id='sp-name'
                  value={name}
                  maxLength={STATUS_PAGE_LIMITS.NAME_MAX}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='sp-slug'>{t('publicUrl')}</Label>
                <div className='flex items-stretch'>
                  <span className='border-input bg-muted text-muted-foreground flex max-w-[55%] min-w-0 items-center rounded-l-md border border-r-0 px-3 text-sm'>
                    <span className='truncate'>{publicHost}/status/</span>
                  </span>
                  <Input
                    id='sp-slug'
                    value={slug}
                    maxLength={STATUS_PAGE_LIMITS.SLUG_MAX}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    className='min-w-0 rounded-l-none'
                  />
                </div>
                <div className='flex justify-between text-xs'>
                  {statusPage.isPublished && slug !== statusPage.slug ? (
                    <span className='text-amber-600 dark:text-amber-400'>{t('slugWarning')}</span>
                  ) : (
                    <span />
                  )}
                  {slugStatusLabel}
                </div>
              </div>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='sp-homepage'>{t('homepageUrl')}</Label>
                <Input
                  id='sp-homepage'
                  type='url'
                  value={homepageUrl}
                  placeholder='https://example.com'
                  onChange={(e) => setHomepageUrl(e.target.value)}
                />
                <p className='text-muted-foreground text-xs'>{t('homepageUrlHint')}</p>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='sp-domain'>{t('customDomain')}</Label>
                <Input
                  id='sp-domain'
                  value={customDomain}
                  placeholder='status.example.com'
                  onChange={(e) => setCustomDomain(e.target.value)}
                />
                <p className='text-muted-foreground text-xs'>{t('customDomainHint')}</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <Switch id='sp-incidents' checked={showPastIncidents} onCheckedChange={setShowPastIncidents} />
              <Label htmlFor='sp-incidents'>{t('showPastIncidents')}</Label>
            </div>
          </section>

          <section className='bg-card border-border space-y-4 rounded-xl border p-5'>
            <h2 className='font-semibold'>{t('branding')}</h2>
            <div className='flex flex-wrap items-start gap-6'>
              <div className='space-y-2'>
                <Label>{t('logo')}</Label>
                <button
                  type='button'
                  className='border-input text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground flex h-16 w-36 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed text-xs transition-colors'
                >
                  <Upload className='h-3.5 w-3.5' />
                  {t('uploadLogo')}
                </button>
              </div>
              <ColorSwatchPicker
                label={t('accentColor')}
                options={ACCENT_PRESETS.map((preset) => ({ value: preset, hex: preset }))}
                value={accentColor}
                onChange={setAccentColor}
              >
                <ColorPickerPopover
                  value={accentColor}
                  onChange={setAccentColor}
                  selected={!ACCENT_PRESETS.includes(accentColor)}
                  ariaLabel={t('accentColor')}
                />
              </ColorSwatchPicker>
              <div className='space-y-2'>
                <Label>{t('theme')}</Label>
                <div className='border-input inline-flex overflow-hidden rounded-md border'>
                  {(['light', 'dark', 'system'] as const).map((value) => (
                    <button
                      key={value}
                      type='button'
                      onClick={() => setTheme(value)}
                      className={`cursor-pointer px-3.5 py-1.5 text-sm ${theme === value ? 'bg-secondary font-semibold' : 'text-muted-foreground'}`}
                    >
                      {t(`themes.${value}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className='space-y-2'>
              <Label>{t('language')}</Label>
              <Select value={language} onValueChange={(value) => setLanguage(value as SupportedLanguages)}>
                <SelectTrigger className='w-[150px] cursor-pointer'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((value) => (
                    <SelectItem key={value} value={value} className='cursor-pointer'>
                      {LANGUAGE_METADATA[value].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className='bg-card border-border space-y-3 rounded-xl border p-5'>
            <h2 className='font-semibold'>{t('visibility.title')}</h2>
            <div className='space-y-3'>
              {(['public', 'unlisted'] as const).map((option) => (
                <button
                  key={option}
                  type='button'
                  onClick={() => setVisibility(option)}
                  className='flex w-full cursor-pointer items-start gap-3 text-left'
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border ${
                      visibility === option ? 'border-primary' : 'border-input'
                    }`}
                  >
                    {visibility === option && <span className='bg-primary h-2 w-2 rounded-full' />}
                  </span>
                  <span>
                    <span className='text-sm font-medium'>{t(`visibility.${option}`)}</span>
                    <span className='text-muted-foreground block text-xs'>{t(`visibility.${option}Hint`)}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className='bg-card border-border space-y-3 rounded-xl border p-5'>
            <div className='flex items-baseline justify-between'>
              <h2 className='font-semibold'>{t('monitors')}</h2>
              <span className='text-muted-foreground text-xs'>
                {t('monitorsHint', { selected: includedCount, total: monitorRows.length })}
              </span>
            </div>
            <div className='space-y-2'>
              {monitorRows.map((row, index) => (
                <div
                  key={row.monitorCheckId}
                  className={`border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center ${row.included ? '' : 'opacity-55'}`}
                >
                  <div className='flex flex-none flex-col'>
                    <button
                      type='button'
                      aria-label={t('moveUp')}
                      onClick={() => moveRow(index, -1)}
                      disabled={index === 0}
                      className='text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30'
                    >
                      <ChevronUp className='h-4 w-4' />
                    </button>
                    <button
                      type='button'
                      aria-label={t('moveDown')}
                      onClick={() => moveRow(index, 1)}
                      disabled={index === monitorRows.length - 1}
                      className='text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30'
                    >
                      <ChevronDown className='h-4 w-4' />
                    </button>
                  </div>
                  <Checkbox
                    checked={row.included}
                    onCheckedChange={(checked) => updateRow(index, { included: checked === true })}
                    disabled={!row.included && includedCount >= STATUS_PAGE_LIMITS.MONITORS_MAX}
                    className='flex-none cursor-pointer'
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium'>{row.name ?? row.url}</div>
                    <div className='text-muted-foreground truncate text-xs'>{row.url}</div>
                  </div>
                  <Input
                    value={row.publicName}
                    maxLength={STATUS_PAGE_LIMITS.PUBLIC_NAME_MAX}
                    placeholder={t('publicNamePlaceholder')}
                    disabled={!row.included}
                    onChange={(e) => updateRow(index, { publicName: e.target.value })}
                    className='sm:w-56'
                  />
                </div>
              ))}
            </div>
          </section>

        </div>

        <div className='lg:sticky lg:top-4'>
          <LivePreview
            dashboardId={dashboardId}
            payload={previewPayload}
            initialLanguage={statusPage.language}
            initialMessages={previewMessages}
            publicHost={publicHost}
            draft={{
              name,
              slug,
              theme,
              accentColor,
              language,
              showPastIncidents,
              monitors: monitorRows.map((row) => ({
                monitorCheckId: row.monitorCheckId,
                included: row.included,
                publicName: row.publicName,
              })),
            }}
          />
        </div>
      </div>

      <Dialog open={showPublishSuccess} onOpenChange={setShowPublishSuccess}>
        <DialogContent className='sm:max-w-md'>
          <div className='flex flex-col items-center pt-2'>
            <span className='flex h-13 w-13 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_0_8px_rgba(34,197,94,0.15)]'>
              <Check className='h-6 w-6 text-white' strokeWidth={3} aria-hidden />
            </span>
            <DialogHeader className='mt-4 items-center text-center sm:text-center'>
              <DialogTitle>{t('publishSuccess.title')}</DialogTitle>
              <DialogDescription>{t('publishSuccess.description')}</DialogDescription>
            </DialogHeader>
          </div>
          <div className='mt-1 flex items-stretch gap-2'>
            <div className='border-input bg-muted text-foreground flex min-w-0 flex-1 items-center rounded-md border px-3 py-2 text-sm'>
              <span className='truncate'>{`${publicHost}/status/${slug}`}</span>
            </div>
            <Button
              variant='outline'
              className='flex-none cursor-pointer'
              onClick={() => {
                navigator.clipboard.writeText(`${publicBaseUrl}/status/${slug}`);
                toast.success(t('publishSuccess.copied'));
              }}
            >
              <Copy className='mr-1 h-3.5 w-3.5' />
              {t('publishSuccess.copy')}
            </Button>
          </div>
          <DialogFooter className='mt-1 sm:justify-center'>
            <Button variant='outline' asChild>
              <Link href={`/dashboard/${dashboardId}/monitoring/status-pages`}>{t('publishSuccess.back')}</Link>
            </Button>
            <Button asChild>
              <a href={`${publicBaseUrl}/status/${slug}`} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='mr-1 h-4 w-4' />
                {t('publishSuccess.view')}
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
