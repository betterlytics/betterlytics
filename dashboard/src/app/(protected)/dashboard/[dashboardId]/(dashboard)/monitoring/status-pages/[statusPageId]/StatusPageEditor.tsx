'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, ExternalLink, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { UnderlineTabs, UnderlineTabsList, UnderlineTabsTrigger } from '@/components/ui/UnderlineTabs';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { ConfirmDialog } from '@/components/dialogs';
import {
  defaultPublicMonitorName,
  type StatusPagePreviewPayload,
  type StatusPageWithMonitors,
} from '@/entities/analytics/statusPage.entities';
import { cn } from '@/lib/utils';
import { IncidentsTab } from './tabs/IncidentsTab';
import { LivePreview } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/LivePreview';
import { type MonitorRow } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/SortableMonitorRow';
import { useStatusPageFormState } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/useStatusPageFormState';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useSlugAvailability } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/useSlugAvailability';
import { updateStatusPageAction } from '@/app/actions/analytics/statusPage.actions';
import { GeneralTab } from './tabs/GeneralTab';
import { CustomizeTab } from './tabs/CustomizeTab';
import { MonitorsTab } from './tabs/MonitorsTab';

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

  return monitors
    .map((monitor) => {
      const selection = selectionByMonitorId.get(monitor.id);
      return {
        monitorCheckId: monitor.id,
        name: monitor.name,
        url: monitor.url,
        included: selection != null,
        publicName: selection?.publicName ?? defaultPublicMonitorName(monitor),
      };
    })
    .sort((a, b) => {
      const positionA = selectionByMonitorId.get(a.monitorCheckId)?.position ?? Number.MAX_SAFE_INTEGER;
      const positionB = selectionByMonitorId.get(b.monitorCheckId)?.position ?? Number.MAX_SAFE_INTEGER;
      return positionA - positionB;
    });
}

function UnsavedDot({ label }: { label: string }) {
  return (
    <span
      role='img'
      aria-label={label}
      title={label}
      className='bg-primary ml-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full align-middle'
    />
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
    visibility: statusPage.visibility,
    homepageUrl: statusPage.homepageUrl,
    customDomain: statusPage.customDomain,
    monitorRows: initialMonitorRows,
  });

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('incidents');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const slugStatus = useSlugAvailability({
    dashboardId,
    slug: form.slug,
    excludeStatusPageId: statusPage.id,
    currentSlug: statusPage.slug,
  });

  const payload = useMemo(() => ({ id: statusPage.id, ...form.input }), [statusPage.id, form.input]);

  const sections = useMemo(
    () => ({
      general: {
        name: form.input.name,
        slug: form.input.slug,
        showPastIncidents: form.input.showPastIncidents,
        visibility: form.input.visibility,
        homepageUrl: form.input.homepageUrl,
        customDomain: form.input.customDomain,
      },
      customize: { theme: form.input.theme, accentColor: form.input.accentColor },
      monitors: form.input.monitors,
    }),
    [form.input],
  );

  const { isDirty, dirty, markSaved } = useUnsavedChanges(sections);

  const savedSnapshotRef = useRef(form.snapshot);

  const saveMutation = useMutation({
    mutationFn: async () => updateStatusPageAction(dashboardId, payload),
    onSuccess: () => {
      markSaved();
      savedSnapshotRef.current = form.snapshot;
      router.refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const handleDiscard = useCallback(() => form.reset(savedSnapshotRef.current), [form]);

  const saveNow = () => saveMutation.mutate(undefined, { onSuccess: () => toast.success(t('saved')) });

  const handleSave = () => (statusPage.isPublished ? setShowPublishConfirm(true) : saveNow());

  const handleBackClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.stopPropagation();
      setShowLeaveConfirm(true);
    },
    [isDirty],
  );

  const backHref = `/dashboard/${dashboardId}/monitoring/status-pages`;

  const incidentMonitors = useMemo(
    () =>
      form.monitorRows
        .filter((row) => row.included)
        .map((row) => ({
          monitorCheckId: row.monitorCheckId,
          publicName: row.publicName.trim() || defaultPublicMonitorName(row),
        })),
    [form.monitorRows],
  );
  const publicHost = publicBaseUrl.replace(/^https?:\/\//, '');
  const publicUrl = `${publicBaseUrl}/status/${form.slug}`;
  const noMonitors = form.includedCount === 0;
  const slugNotSaveable = slugStatus === 'checking' || slugStatus === 'taken' || slugStatus === 'invalid';
  const saveDisabled =
    !isDirty ||
    form.isNameEmpty ||
    noMonitors ||
    slugNotSaveable ||
    !form.isHomepageUrlValid ||
    !form.isCustomDomainValid;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

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
        href={backHref}
        onClick={handleBackClick}
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
        <div className='border-border border-b'>
          <UnderlineTabsList className='border-b-0'>
            <UnderlineTabsTrigger value='incidents'>{t('tabs.incidents')}</UnderlineTabsTrigger>
            <UnderlineTabsTrigger value='general'>
              {t('tabs.general')}
              {dirty.general && <UnsavedDot label={t('unsavedChanges')} />}
            </UnderlineTabsTrigger>
            <UnderlineTabsTrigger value='customize'>
              {t('tabs.customize')}
              {dirty.customize && <UnsavedDot label={t('unsavedChanges')} />}
            </UnderlineTabsTrigger>
            <UnderlineTabsTrigger value='monitors'>
              {t('tabs.monitors')}
              {dirty.monitors && <UnsavedDot label={t('unsavedChanges')} />}
            </UnderlineTabsTrigger>
          </UnderlineTabsList>
        </div>

        {activeTab === 'incidents' ? (
          <div className='mt-6'>
            <IncidentsTab dashboardId={dashboardId} statusPageId={statusPage.id} monitors={incidentMonitors} />
          </div>
        ) : (
          <div className='mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-start'>
            <div className='space-y-8'>
              {activeTab === 'general' && (
                <GeneralTab
                  form={form}
                  slugStatus={slugStatus}
                  publicHost={publicHost}
                  isPublished={statusPage.isPublished}
                  savedSlug={statusPage.slug}
                />
              )}
              {activeTab === 'customize' && (
                <CustomizeTab form={form} dashboardId={dashboardId} statusPageId={statusPage.id} />
              )}
              {activeTab === 'monitors' && <MonitorsTab form={form} />}
            </div>

            <div className='space-y-3'>
              <div className='flex items-end justify-end gap-2 lg:h-12'>
                {isDirty && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    disabled={saveMutation.isPending}
                    onClick={handleDiscard}
                    className='cursor-pointer'
                  >
                    {t('discard')}
                  </Button>
                )}
                <PermissionGate>
                  {(disabled) => (
                    <Button
                      size='sm'
                      disabled={disabled || saveDisabled || saveMutation.isPending}
                      title={!disabled && noMonitors ? t('minMonitorsHint') : undefined}
                      onClick={handleSave}
                      className='cursor-pointer'
                    >
                      {saveMutation.isPending && <Spinner size='sm' className='mr-1.5 border-current' />}
                      {t('save')}
                    </Button>
                  )}
                </PermissionGate>
              </div>
              <div className='lg:sticky lg:top-4'>{livePreview}</div>
            </div>
          </div>
        )}
      </UnderlineTabs>

      <ConfirmDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title={t('confirmLeave.title')}
        description={t('confirmLeave.description')}
        cancelLabel={t('confirmLeave.stay')}
        confirmLabel={t('confirmLeave.leave')}
        onConfirm={() => {
          setShowLeaveConfirm(false);
          router.push(backHref);
        }}
      />

      <ConfirmDialog
        open={showPublishConfirm}
        onOpenChange={setShowPublishConfirm}
        title={t('confirmPublish.title')}
        description={t('confirmPublish.description')}
        confirmLabel={t('confirmPublish.confirm')}
        onConfirm={() => {
          setShowPublishConfirm(false);
          saveNow();
        }}
      />
    </div>
  );
}
