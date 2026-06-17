'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, ExternalLink, Link2 } from 'lucide-react';
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
  type StatusPageWithMonitors,
} from '@/entities/analytics/statusPage.entities';
import { cn } from '@/lib/utils';
import { IncidentsManager } from './IncidentsManager';
import { SortableList } from '@/components/dnd/SortableList';
import { LivePreview } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/LivePreview';
import {
  SortableMonitorRow,
  type MonitorRow,
} from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/SortableMonitorRow';
import { AccentColorField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/AccentColorField';
import { ThemeField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/ThemeField';
import { VisibilityRadioGroup } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/VisibilityRadioGroup';
import { ComingSoonBadge, ComingSoonField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/ComingSoonField';
import { useStatusPageFormState } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/useStatusPageFormState';
import { useSlugAvailability } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/useSlugAvailability';
import { LogoUploadField } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/LogoUploadField';
import { updateStatusPageAction } from '@/app/actions/analytics/statusPage.actions';

type TabKey = 'incidents' | 'general' | 'customize' | 'monitors';
const CONFIG_TABS: TabKey[] = ['general', 'customize', 'monitors'];

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

  const initialMonitorRows = useMemo(() => buildMonitorRows(statusPage, monitors), [statusPage, monitors]);
  const form = useStatusPageFormState({
    name: statusPage.name,
    slug: statusPage.slug,
    theme: statusPage.theme,
    accentColor: statusPage.accentColor,
    logoUrl: statusPage.logoUrl,
    showPastIncidents: statusPage.showPastIncidents,
    monitorRows: initialMonitorRows,
  });

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('incidents');

  const slugStatus = useSlugAvailability({
    dashboardId,
    slug: form.slug,
    excludeStatusPageId: statusPage.id,
    currentSlug: statusPage.slug,
  });

  const payload = useMemo(
    () => ({
      id: statusPage.id,
      name: form.name.trim(),
      slug: form.slug,
      theme: form.theme,
      accentColor: form.accentColor,
      showPastIncidents: form.showPastIncidents,
      monitors: form.monitorsPayload,
    }),
    [statusPage.id, form.name, form.slug, form.theme, form.accentColor, form.showPastIncidents, form.monitorsPayload],
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

  const incidentMonitors = useMemo(
    () =>
      form.monitorRows
        .filter((row) => row.included)
        .map((row) => ({
          monitorCheckId: row.monitorCheckId,
          publicName: row.publicName.trim() || row.name || row.url,
        })),
    [form.monitorRows],
  );
  const publicHost = publicBaseUrl.replace(/^https?:\/\//, '');
  const publicUrl = `${publicBaseUrl}/status/${form.slug}`;
  const saveDisabled =
    !isDirty || payload.name.length === 0 || slugStatus === 'taken' || slugStatus === 'invalid';

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
      draft={form.previewDraft}
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
          <h1 className='truncate text-xl font-semibold tracking-tight'>{form.name || statusPage.name}</h1>
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
              {publicHost}/status/<span className='text-foreground font-medium'>{form.slug}</span>
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
                            value={form.name}
                            maxLength={STATUS_PAGE_LIMITS.NAME_MAX}
                            onChange={(e) => form.setName(e.target.value)}
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
                              value={form.slug}
                              maxLength={STATUS_PAGE_LIMITS.SLUG_MAX}
                              onChange={(e) => form.setSlug(e.target.value.toLowerCase())}
                              className='min-w-0 flex-1 rounded-l-none font-mono'
                            />
                          </div>
                          <div className='flex justify-between text-xs'>
                            {statusPage.isPublished && form.slug !== statusPage.slug ? (
                              <span className='text-amber-600 dark:text-amber-400'>{t('slugWarning')}</span>
                            ) : (
                              <span />
                            )}
                            {slugStatusLabel}
                          </div>
                        </div>
                      </div>
                      <div className='grid gap-4 sm:grid-cols-2'>
                        <ComingSoonField
                          id='sp-homepage'
                          label={t('homepageUrl')}
                          hint={t('homepageUrlHint')}
                          placeholder='https://example.com'
                          type='url'
                        />
                        <ComingSoonField
                          id='sp-domain'
                          label={t('customDomain')}
                          hint={t('customDomainHint')}
                          placeholder='status.example.com'
                        />
                      </div>
                      <div className='border-border flex items-center justify-between gap-4 border-t pt-4'>
                        <div>
                          <div className='text-sm font-medium'>{t('showPastIncidents')}</div>
                          <p className='text-muted-foreground mt-0.5 text-xs'>{t('showPastIncidentsHint')}</p>
                        </div>
                        <Switch
                          checked={form.showPastIncidents}
                          onCheckedChange={form.setShowPastIncidents}
                          aria-label={t('showPastIncidents')}
                        />
                      </div>
                    </div>
                  </Section>

                  <Section title={t('visibility.title')} description={t('visibility.hint')} aside={<ComingSoonBadge />}>
                    <VisibilityRadioGroup />
                  </Section>
                </>
              )}

              {activeTab === 'customize' && (
                <>
                  <Section title={t('branding')} description={t('brandHint')}>
                    <div className='bg-card border-border space-y-5 rounded-xl border p-5'>
                      <LogoUploadField
                        dashboardId={dashboardId}
                        statusPageId={statusPage.id}
                        logoUrl={form.logoUrl}
                        onLogoChange={form.setLogoUrl}
                      />
                      <AccentColorField value={form.accentColor} onChange={form.setAccentColor} />
                    </div>
                  </Section>

                  <Section title={t('appearance')} description={t('appearanceHint')}>
                    <div className='bg-card border-border rounded-xl border p-5'>
                      <ThemeField value={form.theme} onChange={form.setTheme} />
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
                      {t('monitorsHint', { selected: form.includedCount, total: form.monitorRows.length })}
                    </span>
                  }
                >
                  <SortableList
                    items={form.monitorRows}
                    getId={(row) => row.monitorCheckId}
                    onReorder={(next) => form.setMonitorRows(next)}
                    className='bg-card border-border overflow-hidden rounded-xl border'
                  >
                    {form.monitorRows.map((row, index) => (
                      <SortableMonitorRow
                        key={row.monitorCheckId}
                        row={row}
                        index={index}
                        includedCount={form.includedCount}
                        onToggleIncluded={(included) => form.updateRow(index, { included })}
                        onPublicNameChange={(publicName) => form.updateRow(index, { publicName })}
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
