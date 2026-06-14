'use client';

import { Fragment, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Copy, ExternalLink, Loader2, Plus, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  STATUS_PAGE_DEFAULT_ACCENT_COLOR,
  STATUS_PAGE_LIMITS,
  type StatusPageTheme,
} from '@/entities/analytics/statusPage.entities';
import { ColorPickerPopover } from '@/components/ColorPickerPopover';
import { ColorSwatchPicker } from '@/components/ColorSwatchPicker';
import { SortableList } from '@/components/dnd/SortableList';
import {
  checkStatusPageSlugAction,
  createStatusPageAction,
  fetchStatusPageDraftPreviewAction,
  setStatusPagePublishedAction,
  suggestStatusPageDefaultsAction,
} from '@/app/actions/analytics/statusPage.actions';
import { formatPercentage } from '@/utils/formatters';
import { presentMonitorStatus } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/styles';
import { FlowOverlay } from './[statusPageId]/FlowOverlay';
import { LivePreview, type PreviewDraft } from './[statusPageId]/LivePreview';
import { SortableNameRow } from './[statusPageId]/SortableNameRow';
import { type MonitorRow } from './[statusPageId]/SortableMonitorRow';

const ACCENT_PRESETS = ['#4845d8', '#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#0ea5e9'];
const STEPS = ['select', 'customize', 'publish'] as const;
type Step = (typeof STEPS)[number];
type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

type WizardDefaults = Awaited<ReturnType<typeof suggestStatusPageDefaultsAction>>;

type CreateStatusPageWizardProps = {
  dashboardId: string;
  publicHost: string;
  publicBaseUrl: string;
  onClose: () => void;
};

function WizardStepper({
  current,
  labels,
  onJump,
}: {
  current: number;
  labels: Record<Step, string>;
  onJump: (index: number) => void;
}) {
  return (
    <div className='flex items-center gap-3'>
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        // The connector leading into this step is filled once we've reached it.
        const connectorFilled = index <= current;
        return (
          <Fragment key={step}>
            {index > 0 && (
              <span className='bg-border relative h-px w-8 overflow-hidden' aria-hidden>
                <span
                  className={cn(
                    'absolute inset-0 origin-left bg-emerald-500 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out',
                    connectorFilled ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </span>
            )}
            <button
              type='button'
              disabled={!done}
              aria-current={active ? 'step' : undefined}
              onClick={() => done && onJump(index)}
              className={cn('group flex items-center gap-2', done ? 'cursor-pointer' : 'cursor-default')}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold motion-safe:transition-all motion-safe:duration-300',
                  done || active
                    ? 'bg-emerald-500 text-emerald-950'
                    : 'border-border text-muted-foreground border',
                  active && 'ring-offset-background ring-2 ring-emerald-500/30 ring-offset-2',
                )}
              >
                {done ? <Check className='h-3 w-3' strokeWidth={3} /> : index + 1}
              </span>
              {/* Ghost reserves the bold width so the active label doesn't widen the row on each step. */}
              <span className='grid text-xs'>
                <span aria-hidden className='invisible col-start-1 row-start-1 font-semibold'>
                  {labels[step]}
                </span>
                <span
                  className={cn(
                    'col-start-1 row-start-1 whitespace-nowrap transition-colors',
                    active
                      ? 'text-foreground font-semibold'
                      : done
                        ? 'text-muted-foreground group-hover:text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {labels[step]}
                </span>
              </span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}

function WizardForm({
  dashboardId,
  publicHost,
  publicBaseUrl,
  defaults,
  onClose,
}: CreateStatusPageWizardProps & { defaults: WizardDefaults }) {
  const t = useTranslations('statusPagesPage.editor');
  const tStatus = useTranslations('monitoring.status');
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [search, setSearch] = useState('');
  const [name, setName] = useState(defaults.name);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [theme, setTheme] = useState<StatusPageTheme>('system');
  const [accentColor, setAccentColor] = useState(STATUS_PAGE_DEFAULT_ACCENT_COLOR);
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public');
  const [monitorRows, setMonitorRows] = useState<MonitorRow[]>(() =>
    defaults.monitors.map((monitor) => ({
      monitorCheckId: monitor.monitorCheckId,
      name: monitor.name,
      url: monitor.url,
      included: true,
      publicName: monitor.publicName,
      operationalState: monitor.operationalState,
      uptimePercent: monitor.uptimePercent,
    })),
  );
  const [created, setCreated] = useState<{ id: string; slug: string } | null>(null);

  const debouncedSlug = useDebounce(slug, 400);
  useEffect(() => {
    if (debouncedSlug === defaults.slug) {
      setSlugStatus('idle');
      return;
    }
    let cancelled = false;
    setSlugStatus('checking');
    checkStatusPageSlugAction(dashboardId, debouncedSlug).then((result) => {
      if (cancelled) return;
      setSlugStatus(result.available ? 'available' : result.reason === 'taken' ? 'taken' : 'invalid');
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedSlug, dashboardId, defaults.slug]);

  const updateRow = (index: number, patch: Partial<MonitorRow>) =>
    setMonitorRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const includedRows = monitorRows.filter((row) => row.included);
  const excludedRows = monitorRows.filter((row) => !row.included);
  const includedCount = includedRows.length;
  const allSelected = monitorRows.length > 0 && monitorRows.every((row) => row.included);
  const toggleAll = (checked: boolean) =>
    setMonitorRows((rows) => rows.map((row) => ({ ...row, included: checked })));
  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = normalizedSearch
    ? monitorRows.filter(
        (row) =>
          (row.name ?? '').toLowerCase().includes(normalizedSearch) ||
          row.url.toLowerCase().includes(normalizedSearch),
      )
    : monitorRows;
  const monitoringHref = `/dashboard/${dashboardId}/monitoring`;

  const commitMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const page = await createStatusPageAction(dashboardId, {
        name: name.trim(),
        slug,
        theme,
        accentColor,
        monitors: monitorRows
          .filter((row) => row.included)
          .map((row) => ({ monitorCheckId: row.monitorCheckId, publicName: row.publicName.trim() })),
      });
      if (publish) await setStatusPagePublishedAction(dashboardId, page.id, true);
      return { page, publish };
    },
    onSuccess: ({ page, publish }) => {
      if (publish) {
        setCreated({ id: page.id, slug: page.slug });
      } else {
        router.push(`/dashboard/${dashboardId}/monitoring/status-pages/${page.id}`);
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const stepLabels: Record<Step, string> = {
    select: t('wizard.steps.select'),
    customize: t('wizard.steps.customize'),
    publish: t('wizard.steps.publish'),
  };

  const nameEmpty = name.trim().length === 0;
  const slugBlocked = slugStatus === 'taken' || slugStatus === 'invalid';
  const canContinue = step !== 1 || !nameEmpty;
  const canCommit = !nameEmpty && !slugBlocked && !commitMutation.isPending;
  const isLast = step === STEPS.length - 1;

  const previewQuery = useQuery({
    queryKey: ['statusPageDraftPreview', dashboardId],
    queryFn: () => fetchStatusPageDraftPreviewAction(dashboardId),
    staleTime: Infinity,
    gcTime: 0,
  });

  const previewDraft: PreviewDraft = {
    name,
    slug,
    theme,
    accentColor,
    language: previewQuery.data?.language ?? 'en',
    showPastIncidents: true,
    monitors: monitorRows.map((row) => ({
      monitorCheckId: row.monitorCheckId,
      included: row.included,
      publicName: row.publicName,
    })),
    logoUrl: null
  };

  if (created) {
    const publicUrl = `${publicBaseUrl}/status/${created.slug}`;
    return (
      <FlowOverlay
        title={t('wizard.title')}
        closeAriaLabel={t('wizard.close')}
        onClose={() => router.push(`/dashboard/${dashboardId}/monitoring/status-pages`)}
      >
        <div className='mx-auto flex w-full max-w-md flex-col items-center px-4 py-16 text-center'>
          <span className='flex h-13 w-13 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_0_8px_rgba(34,197,94,0.15)]'>
            <Check className='h-6 w-6 text-white' strokeWidth={3} aria-hidden />
          </span>
          <h2 className='mt-5 text-xl font-bold'>{t('publishSuccess.title')}</h2>
          <p className='text-muted-foreground mt-2 text-sm'>{t('publishSuccess.description')}</p>
          <div className='mt-6 flex w-full items-stretch gap-2'>
            <div className='border-input bg-muted text-foreground flex min-w-0 flex-1 items-center rounded-md border px-3 py-2 text-sm'>
              <span className='truncate'>{`${publicHost}/status/${created.slug}`}</span>
            </div>
            <Button
              variant='outline'
              className='flex-none cursor-pointer'
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success(t('publishSuccess.copied'));
              }}
            >
              <Copy className='mr-1 h-3.5 w-3.5' />
              {t('publishSuccess.copy')}
            </Button>
          </div>
          <div className='mt-6 flex gap-2'>
            <Button
              variant='outline'
              className='cursor-pointer'
              onClick={() => router.push(`/dashboard/${dashboardId}/monitoring/status-pages/${created.id}`)}
            >
              {t('publishSuccess.manage')}
            </Button>
            <Button asChild className='cursor-pointer'>
              <a href={publicUrl} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='mr-1 h-4 w-4' />
                {t('publishSuccess.view')}
              </a>
            </Button>
          </div>
        </div>
      </FlowOverlay>
    );
  }

  const actions = (
    <>
      {step > 0 && (
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setDirection('back');
            setStep((s) => s - 1);
          }}
          className='cursor-pointer'
        >
          {t('wizard.back')}
        </Button>
      )}
      {isLast ? (
        <>
          <Button
            variant='outline'
            size='sm'
            disabled={!canCommit}
            onClick={() => commitMutation.mutate(false)}
            className='cursor-pointer'
          >
            {t('wizard.saveDraft')}
          </Button>
          <Button
            size='sm'
            disabled={!canCommit}
            onClick={() => commitMutation.mutate(true)}
            className='cursor-pointer'
          >
            {t('publish')}
          </Button>
        </>
      ) : (
        <Button
          size='sm'
          disabled={!canContinue}
          onClick={() => {
            setDirection('forward');
            setStep((s) => s + 1);
          }}
          className='cursor-pointer'
        >
          {t('wizard.continue')}
        </Button>
      )}
    </>
  );

  return (
    <FlowOverlay
      title={t('wizard.title')}
      closeAriaLabel={t('wizard.close')}
      onClose={onClose}
      center={
        <WizardStepper
          current={step}
          labels={stepLabels}
          onJump={(index) => {
            setDirection('back');
            setStep(index);
          }}
        />
      }
      actions={actions}
      bodyClassName='flex min-h-0 flex-1 justify-center overflow-hidden'
    >
      <div className='flex min-h-0 w-full max-w-6xl'>
        <div className='flex-1 overflow-y-auto'>
          <div className='mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10'>
            <div
              key={step}
              className={cn(
                'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200',
                direction === 'forward' ? 'motion-safe:slide-in-from-right-3' : 'motion-safe:slide-in-from-left-3',
              )}
            >
              {step === 0 && (
                <div className='space-y-5'>
                  <div className='space-y-1'>
                    <h2 className='text-lg font-semibold'>{t('wizard.select.heading')}</h2>
                    <p className='text-muted-foreground text-sm'>{t('wizard.select.description')}</p>
                  </div>

                  {monitorRows.length === 0 ? (
                    <div className='border-border flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center'>
                      <span className='bg-muted text-muted-foreground flex h-11 w-11 items-center justify-center rounded-full'>
                        <Search className='h-5 w-5' />
                      </span>
                      <div className='space-y-1'>
                        <p className='text-sm font-semibold'>{t('wizard.noMonitorsTitle')}</p>
                        <p className='text-muted-foreground mx-auto max-w-xs text-sm'>{t('wizard.noMonitors')}</p>
                      </div>
                      <Button asChild size='sm' className='mt-1 cursor-pointer'>
                        <Link href={monitoringHref}>
                          <Plus className='mr-1 h-4 w-4' />
                          {t('wizard.createMonitor')}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className='flex items-end justify-between gap-3'>
                        <div className='relative w-full max-w-[240px]'>
                          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                          <Input
                            type='text'
                            value={search}
                            placeholder={t('wizard.searchMonitors')}
                            onChange={(e) => setSearch(e.target.value)}
                            className='pl-9'
                          />
                        </div>
                        <label className='flex flex-none cursor-pointer items-center gap-2'>
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={(checked) => toggleAll(checked === true)}
                          />
                          <span className='text-sm font-medium'>{t('wizard.selectAll')}</span>
                        </label>
                      </div>

                      <div className='border-border bg-card overflow-hidden rounded-xl border'>
                        {filteredRows.length === 0 ? (
                          <div className='text-muted-foreground px-4 py-10 text-center text-sm'>
                            {t('wizard.noSearchResults')}
                          </div>
                        ) : (
                          filteredRows.map((row) => {
                            const index = monitorRows.findIndex((r) => r.monitorCheckId === row.monitorCheckId);
                            const presentation = row.operationalState
                              ? presentMonitorStatus(row.operationalState)
                              : null;
                            return (
                              <label
                                key={row.monitorCheckId}
                                className={cn(
                                  'border-border/60 hover:bg-muted/40 flex cursor-pointer items-center gap-3.5 border-t px-4 py-3 transition first:border-t-0',
                                  !row.included && 'opacity-50',
                                )}
                              >
                                <Checkbox
                                  checked={row.included}
                                  onCheckedChange={(checked) => updateRow(index, { included: checked === true })}
                                  className='flex-none'
                                />
                                <div className='min-w-0 flex-1'>
                                  <div className='truncate text-sm font-medium'>{row.name ?? row.url}</div>
                                  <div className='text-muted-foreground truncate text-xs'>{row.url}</div>
                                </div>
                                <div className='flex flex-none items-center gap-2.5'>
                                  {presentation && (
                                    <span
                                      className={cn(
                                        'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                                        presentation.theme.badgeBorder,
                                        presentation.theme.badgeBg,
                                        presentation.theme.text,
                                      )}
                                    >
                                      {tStatus(presentation.labelKey)}
                                    </span>
                                  )}
                                  <span className='text-muted-foreground w-12 text-right text-xs font-medium tabular-nums'>
                                    {row.uptimePercent != null
                                      ? formatPercentage(row.uptimePercent, locale, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                          trimHundred: true,
                                        })
                                      : '—'}
                                  </span>
                                </div>
                              </label>
                            );
                          })
                        )}
                        <div className='border-border/60 bg-muted/60 flex items-center justify-between gap-3 border-t px-4 py-3 text-xs'>
                          <span className='text-muted-foreground'>
                            {t('wizard.selectedCount', { selected: includedCount, total: monitorRows.length })}
                          </span>
                          <span className='text-muted-foreground'>
                            {t('wizard.noMonitorYet')}{' '}
                            <Link href={monitoringHref} className='text-primary font-medium hover:underline'>
                              {t('wizard.createMonitor')}
                            </Link>
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className='space-y-7'>
                  <div className='space-y-1'>
                    <h2 className='text-lg font-semibold'>{t('wizard.customize.heading')}</h2>
                    <p className='text-muted-foreground text-sm'>{t('wizard.customize.description')}</p>
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor='wiz-name'>{t('pageName')}</Label>
                    <Input
                      id='wiz-name'
                      value={name}
                      maxLength={STATUS_PAGE_LIMITS.NAME_MAX}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className='flex flex-wrap items-start gap-8'>
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
                            className={cn(
                              'cursor-pointer px-3.5 py-1.5 text-sm',
                              theme === value ? 'bg-secondary font-semibold' : 'text-muted-foreground',
                            )}
                          >
                            {t(`themes.${value}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {includedRows.length > 0 && (
                    <div className='space-y-2'>
                      <div className='flex items-baseline justify-between'>
                        <Label>{t('wizard.publicNames')}</Label>
                        <span className='text-muted-foreground text-xs'>{t('wizard.dragReorder')}</span>
                      </div>
                      <SortableList
                        items={includedRows}
                        getId={(row) => row.monitorCheckId}
                        onReorder={(next) => setMonitorRows([...next, ...excludedRows])}
                        className='space-y-2'
                      >
                        {includedRows.map((row) => (
                          <SortableNameRow
                            key={row.monitorCheckId}
                            row={row}
                            onPublicNameChange={(publicName) =>
                              updateRow(
                                monitorRows.findIndex((r) => r.monitorCheckId === row.monitorCheckId),
                                { publicName },
                              )
                            }
                          />
                        ))}
                      </SortableList>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className='space-y-6'>
                  <div className='space-y-1'>
                    <h2 className='text-lg font-semibold'>{t('wizard.publish.heading')}</h2>
                    <p className='text-muted-foreground text-sm'>{t('wizard.publish.description')}</p>
                  </div>

                  <div className='space-y-1.5'>
                    <Label htmlFor='wiz-slug'>{t('publicUrl')}</Label>
                    <div className='flex items-stretch'>
                      <span className='border-input bg-muted text-muted-foreground flex max-w-[55%] min-w-0 items-center rounded-l-md border border-r-0 px-3 text-sm'>
                        <span className='truncate'>{publicHost}/status/</span>
                      </span>
                      <Input
                        id='wiz-slug'
                        value={slug}
                        maxLength={STATUS_PAGE_LIMITS.SLUG_MAX}
                        onChange={(e) => setSlug(e.target.value.toLowerCase())}
                        className='min-w-0 rounded-l-none'
                      />
                    </div>
                    {slugStatus !== 'idle' && (
                      <p
                        className={cn(
                          'text-xs',
                          slugStatus === 'available'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : slugStatus === 'checking'
                              ? 'text-muted-foreground'
                              : 'text-destructive',
                        )}
                      >
                        {t(`slugStatus.${slugStatus}`)}
                      </p>
                    )}
                  </div>

                  <div className='space-y-3'>
                    <Label>{t('visibility.title')}</Label>
                    {(['public', 'unlisted'] as const).map((option) => (
                      <button
                        key={option}
                        type='button'
                        onClick={() => setVisibility(option)}
                        className='flex w-full cursor-pointer items-start gap-3 text-left'
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border',
                            visibility === option ? 'border-primary' : 'border-input',
                          )}
                        >
                          {visibility === option && <span className='bg-primary h-2 w-2 rounded-full' />}
                        </span>
                        <span>
                          <span className='text-sm font-medium'>{t(`visibility.${option}`)}</span>
                          <span className='text-muted-foreground block text-xs'>
                            {t(`visibility.${option}Hint`)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className='border-border bg-muted/40 space-y-2 rounded-lg border p-4'>
                    <div className='text-muted-foreground text-xs font-medium'>{t('wizard.summary')}</div>
                    <div className='flex justify-between gap-4 text-sm'>
                      <span className='text-muted-foreground'>{t('pageName')}</span>
                      <span className='min-w-0 truncate font-medium'>{name.trim() || defaults.name}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>{t('monitors')}</span>
                      <span className='font-medium'>{t('wizard.summaryMonitors', { count: includedCount })}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>{t('theme')}</span>
                      <span className='font-medium'>{t(`themes.${theme}`)}</span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>{t('accentColor')}</span>
                      <span className='flex items-center gap-2 font-medium'>
                        <span
                          className='h-3.5 w-3.5 rounded-full'
                          style={{ backgroundColor: accentColor }}
                          aria-hidden
                        />
                        {accentColor}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className='hidden min-h-0 w-[460px] flex-none overflow-y-auto lg:block'>
          <div className='min-h-full px-2 py-8 sm:py-10'>
            {previewQuery.data ? (
              <LivePreview
                dashboardId={dashboardId}
                payload={previewQuery.data.payload}
                initialLanguage={previewQuery.data.language}
                initialMessages={previewQuery.data.messages}
                publicHost={publicHost}
                draft={previewDraft}
              />
            ) : previewQuery.isError ? (
              <p className='text-muted-foreground pt-10 text-sm'>{t('error')}</p>
            ) : (
              <div className='flex justify-center pt-10'>
                <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
              </div>
            )}
          </div>
        </aside>
      </div>
    </FlowOverlay>
  );
}

export function CreateStatusPageWizard({
  dashboardId,
  publicHost,
  publicBaseUrl,
  onClose,
}: CreateStatusPageWizardProps) {
  const t = useTranslations('statusPagesPage.editor');
  const defaultsQuery = useQuery({
    queryKey: ['statusPageDefaults', dashboardId],
    queryFn: () => suggestStatusPageDefaultsAction(dashboardId),
    staleTime: 0,
    gcTime: 0,
  });

  if (defaultsQuery.data) {
    return (
      <WizardForm
        dashboardId={dashboardId}
        publicHost={publicHost}
        publicBaseUrl={publicBaseUrl}
        defaults={defaultsQuery.data}
        onClose={onClose}
      />
    );
  }

  return (
    <FlowOverlay title={t('wizard.title')} closeAriaLabel={t('wizard.close')} onClose={onClose}>
      <div className='flex h-full items-center justify-center py-20'>
        {defaultsQuery.isError ? (
          <p className='text-muted-foreground text-sm'>{t('error')}</p>
        ) : (
          <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
        )}
      </div>
    </FlowOverlay>
  );
}
