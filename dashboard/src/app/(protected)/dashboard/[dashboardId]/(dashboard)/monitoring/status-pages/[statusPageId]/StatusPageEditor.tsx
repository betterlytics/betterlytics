'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, ExternalLink, Link2, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UnderlineTabs, UnderlineTabsList, UnderlineTabsTrigger } from '@/components/ui/UnderlineTabs';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { useDebounce } from '@/hooks/useDebounce';
import {
  STATUS_PAGE_LIMITS,
  type StatusPagePreviewPayload,
  type StatusPageTheme,
  type StatusPageWithMonitors,
} from '@/entities/analytics/statusPage.entities';
import { ColorPickerPopover } from '@/components/ColorPickerPopover';
import { ColorSwatchPicker } from '@/components/ColorSwatchPicker';
import { SortableList } from '@/components/dnd/SortableList';
import { cn } from '@/lib/utils';
import { ThemeSegmentedControl } from '../ThemeSegmentedControl';
import { LivePreview } from './LivePreview';
import { IncidentsManager } from './IncidentsManager';
import { SortableMonitorRow, type MonitorRow } from './SortableMonitorRow';
import {
  checkStatusPageSlugAction,
  removeStatusPageLogoAction,
  updateStatusPageAction,
  uploadStatusPageLogoAction,
} from '@/app/actions/analytics/statusPage.actions';

const ACCENT_PRESETS = ['#4845d8', '#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#0ea5e9'];

type TabKey = 'incidents' | 'general' | 'customize' | 'monitors';
const CONFIG_TABS: TabKey[] = ['general', 'customize', 'monitors'];

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

/** Section heading + description sit outside a lighter bordered box (Betterlytics settings pattern). */
function Section({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className='mb-3 flex items-end justify-between gap-3'>
        <div>
          <h2 className='font-semibold'>{title}</h2>
          {description && <p className='text-muted-foreground mt-1 text-sm'>{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
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
  const [showPastIncidents, setShowPastIncidents] = useState(statusPage.showPastIncidents);
  const [homepageUrl, setHomepageUrl] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public');
  const [copied, setCopied] = useState(false);
  const [monitorRows, setMonitorRows] = useState<MonitorRow[]>(() => buildMonitorRows(statusPage, monitors));
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [activeTab, setActiveTab] = useState<TabKey>('incidents');

  const payload = useMemo(
    () => ({
      id: statusPage.id,
      name: name.trim(),
      slug,
      theme,
      accentColor,
      showPastIncidents,
      monitors: monitorRows
        .filter((row) => row.included)
        .map((row) => ({ monitorCheckId: row.monitorCheckId, publicName: row.publicName.trim() })),
    }),
    [statusPage.id, name, slug, theme, accentColor, showPastIncidents, monitorRows],
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
  const publicUrl = `${publicBaseUrl}/status/${slug}`;
  const saveDisabled = !isDirty || payload.name.length === 0 || slugStatus === 'taken' || slugStatus === 'invalid';

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

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

  const livePreview = (
    <LivePreview
      payload={previewPayload}
      messages={previewMessages}
      publicHost={publicHost}
      draft={{
        name,
        slug,
        theme,
        accentColor,
        logoUrl,
        showPastIncidents,
        monitors: monitorRows.map((row) => ({
          monitorCheckId: row.monitorCheckId,
          included: row.included,
          publicName: row.publicName,
        })),
      }}
    />
  );

  return (
    <div>
      {/* Persistent top bar */}
      <Link
        href={`/dashboard/${dashboardId}/monitoring/status-pages`}
        className='text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1.5 text-sm'
      >
        <ArrowLeft className='h-3.5 w-3.5' />
        {t('back')}
      </Link>

      <div className='min-w-0'>
        <div className='mb-2.5 flex items-center gap-2.5'>
          <h1 className='truncate text-xl font-semibold tracking-tight'>{name || statusPage.name}</h1>
          <span
            className={cn(
              'flex-none rounded-md px-2 py-0.5 text-xs font-semibold',
              statusPage.isPublished
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {statusPage.isPublished ? t('statusPublished') : t('statusDraft')}
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='border-border bg-card flex h-8 items-center gap-2 rounded-md border pr-1 pl-2.5'>
            <Link2 className='text-muted-foreground h-3.5 w-3.5 flex-none' />
            <span className='text-muted-foreground max-w-[55vw] truncate font-mono text-xs sm:max-w-xs'>
              {publicHost}/status/<span className='text-foreground font-medium'>{slug}</span>
            </span>
            <button
              type='button'
              onClick={copyUrl}
              aria-label={t('copyUrl')}
              className='text-muted-foreground hover:text-foreground hover:bg-accent flex h-6 w-6 flex-none cursor-pointer items-center justify-center rounded'
            >
              {copied ? <Check className='h-3.5 w-3.5 text-emerald-500' /> : <Copy className='h-3.5 w-3.5' />}
            </button>
          </div>
          <a
            href={publicUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='border-border bg-card text-foreground hover:bg-accent inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors'
          >
            {t('viewPage')}
            <ExternalLink className='h-3 w-3' />
          </a>
        </div>
      </div>

      <UnderlineTabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)} className='mt-5'>
        {/* Tab bar shares its row with a contextual Save action. The reserved min-height keeps the
            row a constant height whether or not Save is shown, so switching tabs never shifts the
            layout (the Save button only appears on the page-settings tabs). */}
        <div className='border-border flex min-h-11 flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b'>
          <UnderlineTabsList className='border-b-0'>
            <UnderlineTabsTrigger value='incidents'>{t('tabs.incidents')}</UnderlineTabsTrigger>
            <UnderlineTabsTrigger value='general'>{t('tabs.general')}</UnderlineTabsTrigger>
            <UnderlineTabsTrigger value='customize'>{t('tabs.customize')}</UnderlineTabsTrigger>
            <UnderlineTabsTrigger value='monitors'>{t('tabs.monitors')}</UnderlineTabsTrigger>
          </UnderlineTabsList>
          {CONFIG_TABS.includes(activeTab) && (
            <PermissionGate>
              {(disabled) => (
                <Button
                  size='sm'
                  disabled={disabled || saveDisabled || saveMutation.isPending}
                  onClick={() => saveMutation.mutate(undefined, { onSuccess: () => toast.success(t('saved')) })}
                  className='mb-2 cursor-pointer'
                >
                  {t('save')}
                </Button>
              )}
            </PermissionGate>
          )}
        </div>

        {activeTab === 'incidents' ? (
          <div className='mt-6'>
            <IncidentsManager dashboardId={dashboardId} statusPageId={statusPage.id} monitors={incidentMonitors} />
          </div>
        ) : (
          <div className='mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-start'>
            <div className='space-y-8'>
              {activeTab === 'general' && (
                <>
                  <Section title={t('pageDetails')} description={t('pageDetailsHint')}>
                    <div className='bg-card border-border space-y-4 rounded-xl border p-5'>
                      {/* Page name and Public URL stack on smaller screens (so the URL isn't cramped),
                          but share a row once there's room for both at 2xl. */}
                      <div className='grid gap-4 2xl:grid-cols-2 2xl:items-start'>
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
                            <span className='border-input bg-muted text-muted-foreground flex flex-none items-center rounded-l-md border border-r-0 px-3 font-mono text-sm whitespace-nowrap'>
                              {publicHost}/status/
                            </span>
                            <Input
                              id='sp-slug'
                              value={slug}
                              maxLength={STATUS_PAGE_LIMITS.SLUG_MAX}
                              onChange={(e) => setSlug(e.target.value.toLowerCase())}
                              className='min-w-0 flex-1 rounded-l-none font-mono'
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
                      <div className='border-border flex items-center justify-between gap-4 border-t pt-4'>
                        <div>
                          <div className='text-sm font-medium'>{t('showPastIncidents')}</div>
                          <p className='text-muted-foreground mt-0.5 text-xs'>{t('showPastIncidentsHint')}</p>
                        </div>
                        <Switch
                          checked={showPastIncidents}
                          onCheckedChange={setShowPastIncidents}
                          aria-label={t('showPastIncidents')}
                        />
                      </div>
                    </div>
                  </Section>

                  <Section title={t('visibility.title')} description={t('visibility.hint')}>
                    <div className='bg-card border-border overflow-hidden rounded-xl border'>
                      {(['public', 'unlisted'] as const).map((option, index) => (
                        <button
                          key={option}
                          type='button'
                          onClick={() => setVisibility(option)}
                          className={cn(
                            'flex w-full cursor-pointer items-start gap-3 p-4 text-left transition-colors',
                            index > 0 && 'border-border border-t',
                            visibility === option ? 'bg-primary/6' : 'hover:bg-muted/40',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border',
                              visibility === option ? 'border-primary' : 'border-input',
                            )}
                          >
                            {visibility === option && <span className='bg-primary h-2 w-2 rounded-full' />}
                          </span>
                          <span className='min-w-0'>
                            <span className='block text-sm font-medium'>{t(`visibility.${option}`)}</span>
                            <span className='text-muted-foreground mt-0.5 block text-xs leading-relaxed'>
                              {t(`visibility.${option}Hint`)}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {activeTab === 'customize' && (
                <>
                  <Section title={t('branding')} description={t('brandHint')}>
                    <div className='bg-card border-border space-y-5 rounded-xl border p-5'>
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
                    </div>
                  </Section>

                  <Section title={t('appearance')} description={t('appearanceHint')}>
                    <div className='bg-card border-border rounded-xl border p-5'>
                      <div className='space-y-2'>
                        <Label>{t('theme')}</Label>
                        <ThemeSegmentedControl value={theme} onChange={setTheme} />
                      </div>
                    </div>
                  </Section>
                </>
              )}

              {activeTab === 'monitors' && (
                <Section
                  title={t('monitors')}
                  description={t('monitorsDescription')}
                  aside={
                    <span className='text-muted-foreground flex-none text-xs whitespace-nowrap'>
                      {t('monitorsHint', { selected: includedCount, total: monitorRows.length })}
                    </span>
                  }
                >
                  <SortableList
                    items={monitorRows}
                    getId={(row) => row.monitorCheckId}
                    onReorder={(next) => setMonitorRows(next)}
                    className='bg-card border-border overflow-hidden rounded-xl border'
                  >
                    {monitorRows.map((row, index) => (
                      <SortableMonitorRow
                        key={row.monitorCheckId}
                        row={row}
                        index={index}
                        includedCount={includedCount}
                        onToggleIncluded={(included) => updateRow(index, { included })}
                        onPublicNameChange={(publicName) => updateRow(index, { publicName })}
                      />
                    ))}
                  </SortableList>
                </Section>
              )}
            </div>

            <div className='lg:sticky lg:top-4'>{livePreview}</div>
          </div>
        )}
      </UnderlineTabs>
    </div>
  );
}
