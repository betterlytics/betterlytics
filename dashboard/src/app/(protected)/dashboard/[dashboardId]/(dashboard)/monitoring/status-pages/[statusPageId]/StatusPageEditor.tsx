'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, ExternalLink, Loader2, Megaphone, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
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
import {
  UnderlineTabs,
  UnderlineTabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from '@/components/ui/UnderlineTabs';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { useDebounce } from '@/hooks/useDebounce';
import { LANGUAGE_METADATA, SUPPORTED_LANGUAGES, type SupportedLanguages } from '@/constants/i18n';
import {
  STATUS_PAGE_LIMITS,
  type PublicStatusPageIncident,
  type StatusPagePreviewPayload,
  type StatusPageTheme,
  type StatusPageWithMonitors,
} from '@/entities/analytics/statusPage.entities';
import { ColorPickerPopover } from '@/components/ColorPickerPopover';
import { ColorSwatchPicker } from '@/components/ColorSwatchPicker';
import { SortableList } from '@/components/dnd/SortableList';
import { LivePreview } from './LivePreview';
import { IncidentsManager } from './IncidentsManager';
import { SortableMonitorRow, type MonitorRow } from './SortableMonitorRow';
import {
  checkStatusPageSlugAction,
  removeStatusPageLogoAction,
  setStatusPagePublishedAction,
  updateStatusPageAction,
  uploadStatusPageLogoAction,
} from '@/app/actions/analytics/statusPage.actions';

const ACCENT_PRESETS = ['#4845d8', '#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#0ea5e9'];

// Generous guard so we don't read an enormous file into the tab before resizing; the canvas
// step shrinks the logo to well under STATUS_PAGE_LIMITS.LOGO_MAX_BYTES regardless.
const MAX_ORIGINAL_LOGO_BYTES = 10 * 1024 * 1024;
const LOGO_MAX_DIMENSION = 128;

/** Downscale to a small square-bounded WebP on the client so the server only ever stores a tiny blob. */
async function resizeToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, LOGO_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unsupported');
    context.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Encode failed'))), 'image/webp', 0.9);
    });
  } finally {
    bitmap.close();
  }
}

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
  const [logoUrl, setLogoUrl] = useState<string | null>(statusPage.logoUrl);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [language, setLanguage] = useState<SupportedLanguages>(statusPage.language);
  const [showPastIncidents, setShowPastIncidents] = useState(statusPage.showPastIncidents);
  const [homepageUrl, setHomepageUrl] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public');
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [monitorRows, setMonitorRows] = useState<MonitorRow[]>(() => buildMonitorRows(statusPage, monitors));
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [activeTab, setActiveTab] = useState<'setup' | 'incidents'>(
    statusPage.isPublished ? 'incidents' : 'setup',
  );
  const [draftIncident, setDraftIncident] = useState<PublicStatusPageIncident | null>(null);

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
        setActiveTab('incidents');
        setShowPublishSuccess(true);
      } else {
        toast.success(t('unpublished'));
      }
      router.refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  // Logo is uploaded via its own action (binary, with its own validation), independent of the
  // debounced JSON autosave above.
  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      const blob = await resizeToWebp(file);
      const formData = new FormData();
      formData.append('logo', blob, 'logo.webp');
      return uploadStatusPageLogoAction(dashboardId, statusPage.id, formData);
    },
    onSuccess: (result) => {
      setLogoUrl(result.logoUrl);
      router.refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const removeLogoMutation = useMutation({
    mutationFn: async () => removeStatusPageLogoAction(dashboardId, statusPage.id),
    onSuccess: () => {
      setLogoUrl(null);
      router.refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const handleLogoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (file.size > MAX_ORIGINAL_LOGO_BYTES) {
      toast.error(t('logoTooLarge'));
      return;
    }
    logoMutation.mutate(file);
  };

  const logoBusy = logoMutation.isPending || removeLogoMutation.isPending;

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

  const updateRow = (index: number, patch: Partial<MonitorRow>) => {
    setMonitorRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const includedCount = monitorRows.filter((row) => row.included).length;
  
  const incidentMonitors = useMemo(
    () =>
      monitorRows
        .filter((row) => row.included)
        .map((row) => ({ monitorCheckId: row.monitorCheckId, publicName: row.publicName.trim() || row.name || row.url })),
    [monitorRows],
  );
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

      <UnderlineTabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'setup' | 'incidents')}>
        <UnderlineTabsList>
          <UnderlineTabsTrigger value='incidents'>{t('tabs.incidents')}</UnderlineTabsTrigger>
          <UnderlineTabsTrigger value='setup'>{t('tabs.setup')}</UnderlineTabsTrigger>
        </UnderlineTabsList>

        <div className='mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start'>
          <div className='space-y-4'>
            <UnderlineTabsContent value='setup' className='space-y-4'>
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
                <input
                  ref={logoInputRef}
                  type='file'
                  accept='image/png,image/jpeg,image/webp'
                  className='hidden'
                  onChange={handleLogoSelected}
                />
                <PermissionGate>
                  {(disabled) =>
                    logoUrl ? (
                      // Fixed-size chip, same footprint as the empty tile so uploading doesn't shift layout.
                      // Block (not inline-block) so there's no inline baseline/descender gap below it.
                      <div className='relative h-20 w-20'>
                        <button
                          type='button'
                          aria-label={t('replaceLogo')}
                          disabled={disabled || logoBusy}
                          onClick={() => logoInputRef.current?.click()}
                          className='group border-input relative block h-20 w-20 cursor-pointer overflow-hidden rounded-md border disabled:cursor-not-allowed'
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- owner-provided logo, not optimizable via next/image */}
                          <img src={logoUrl} alt='' className='h-full w-full object-contain p-1.5' />
                          <span className='absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/55 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100'>
                            <Upload className='h-4 w-4' />
                            {t('replaceLogo')}
                          </span>
                          {logoBusy && (
                            <span className='absolute inset-0 flex items-center justify-center bg-black/55'>
                              <Loader2 className='h-5 w-5 animate-spin text-white' />
                            </span>
                          )}
                        </button>
                        <button
                          type='button'
                          aria-label={t('removeLogo')}
                          disabled={disabled || logoBusy}
                          onClick={() => removeLogoMutation.mutate()}
                          className='border-input bg-background text-muted-foreground hover:text-destructive absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50'
                        >
                          <X className='h-3 w-3' />
                        </button>
                      </div>
                    ) : (
                      <button
                        type='button'
                        disabled={disabled || logoBusy}
                        onClick={() => logoInputRef.current?.click()}
                        className='border-input text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed px-1 text-center text-[10px] leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50'
                      >
                        {logoMutation.isPending ? (
                          <Loader2 className='h-5 w-5 animate-spin' />
                        ) : (
                          <Upload className='h-5 w-5' />
                        )}
                        {t('uploadLogo')}
                      </button>
                    )
                  }
                </PermissionGate>
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
            <SortableList
              items={monitorRows}
              getId={(row) => row.monitorCheckId}
              onReorder={(next) => setMonitorRows(next)}
              className='space-y-2'
            >
              {monitorRows.map((row, index) => (
                <SortableMonitorRow
                  key={row.monitorCheckId}
                  row={row}
                  includedCount={includedCount}
                  onToggleIncluded={(included) => updateRow(index, { included })}
                  onPublicNameChange={(publicName) => updateRow(index, { publicName })}
                />
              ))}
            </SortableList>
          </section>
            </UnderlineTabsContent>

            <UnderlineTabsContent value='incidents'>
              {statusPage.isPublished ? (
                <IncidentsManager
                  dashboardId={dashboardId}
                  statusPageId={statusPage.id}
                  monitors={incidentMonitors}
                  onDraftIncidentChange={setDraftIncident}
                />
              ) : (
                <div className='bg-card border-border flex flex-col items-center rounded-xl border px-6 py-14 text-center'>
                  <span className='bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full'>
                    <Megaphone className='h-6 w-6' />
                  </span>
                  <h3 className='mt-4 font-semibold'>{t('incidentsLocked.title')}</h3>
                  <p className='text-muted-foreground mt-1 max-w-sm text-sm leading-relaxed'>
                    {t('incidentsLocked.description')}
                  </p>
                  <Button className='mt-5 cursor-pointer' onClick={() => setActiveTab('setup')}>
                    {t('incidentsLocked.cta')}
                  </Button>
                </div>
              )}
            </UnderlineTabsContent>
          </div>

        <div className='lg:sticky lg:top-4'>
          <LivePreview
            dashboardId={dashboardId}
            payload={previewPayload}
            initialLanguage={statusPage.language}
            initialMessages={previewMessages}
            publicHost={publicHost}
            draftIncident={draftIncident}
            draft={{
              name,
              slug,
              theme,
              accentColor,
              language,
              logoUrl,
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
      </UnderlineTabs>

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
