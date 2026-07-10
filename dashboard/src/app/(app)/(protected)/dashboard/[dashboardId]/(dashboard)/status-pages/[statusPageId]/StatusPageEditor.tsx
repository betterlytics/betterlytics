'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, Maximize2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { UnderlineTabs, UnderlineTabsList, UnderlineTabsTrigger } from '@/components/ui/UnderlineTabs';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { ConfirmDialog, DestructiveActionDialog } from '@/components/dialogs';
import { type StatusPageWithMonitors } from '@/entities/analytics/statusPage/statusPage.entities';
import { type StatusPagePreviewPayload } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { defaultPublicMonitorName, statusPagePublicUrl } from '@/entities/analytics/statusPage/statusPage.helpers';
import { cn } from '@/lib/utils';
import { IncidentsTab } from './tabs/IncidentsTab';
import { LivePreview } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/LivePreview';
import {
  useStatusPageFormState,
  type MonitorRow,
} from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { CopyButton } from '@/components/CopyButton';
import { useSlugAvailability } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useSlugAvailability';
import { useStatusPageValidation } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageValidation';
import { useStatusPageEditor } from './useStatusPageEditor';
import { SettingsTab } from './tabs/SettingsTab';
import { EditStatusPageStudio } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/studio/EditStatusPageStudio';

const TAB_KEYS = ['incidents', 'settings'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const isTabKey = (value: string | null): value is TabKey => TAB_KEYS.includes(value as TabKey);

type StatusPageEditorProps = {
  dashboardId: string;
  statusPage: StatusPageWithMonitors;
  monitors: Array<{ id: string; name: string | null; url: string }>;
  publicBaseUrl: string;
  dashboardDomain: string;
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
  dashboardDomain,
  previewPayload,
  previewMessages,
}: StatusPageEditorProps) {
  const t = useTranslations('statusPagesPage.editor');
  const tActions = useTranslations('statusPagesPage.actions');
  const router = useRouter();

  const initialMonitorRows = useMemo(() => buildMonitorRows(statusPage, monitors), [statusPage, monitors]);
  const form = useStatusPageFormState({
    name: statusPage.name,
    slug: statusPage.slug,
    theme: statusPage.theme,
    accentColor: statusPage.accentColor,
    logoUrl: statusPage.logoUrl,
    faviconUrl: statusPage.faviconUrl,
    showPastIncidents: statusPage.showPastIncidents,
    hideBranding: statusPage.hideBranding,
    visibility: statusPage.visibility,
    homepageUrl: statusPage.homepageUrl,
    customDomain: statusPage.customDomain,
    monitorRows: initialMonitorRows,
  });

  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const activeTab: TabKey = isTabKey(urlTab) ? urlTab : 'incidents';
  const onSettingsTab = activeTab === 'settings';

  const setActiveTab = useCallback((tab: TabKey) => {
    const params = new URLSearchParams(window.location.search);
    if (tab === 'incidents') params.delete('tab');
    else params.set('tab', tab);
    const query = params.toString();
    // Native replaceState keeps useSearchParams in sync without an RSC refetch or a history entry.
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, []);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [showStudio, setShowStudio] = useState(() => searchParams.get('studio') === '1');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const closeStudio = useCallback(() => {
    setShowStudio(false);
    const params = new URLSearchParams(window.location.search);
    if (params.has('studio')) {
      params.delete('studio');
      const query = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    }
  }, []);

  const slugStatus = useSlugAvailability({
    dashboardId,
    slug: form.slug,
    excludeStatusPageId: statusPage.id,
    currentSlug: statusPage.slug,
  });

  // 'studio' groups everything edited in the fullscreen studio (design/content);
  // 'settings' is what stays editable on this page (lifecycle settings).
  const sections = useMemo(
    () => ({
      settings: {
        slug: form.input.slug,
        visibility: form.input.visibility,
        customDomain: form.input.customDomain,
      },
      studio: {
        name: form.input.name,
        homepageUrl: form.input.homepageUrl,
        showPastIncidents: form.input.showPastIncidents,
        theme: form.input.theme,
        accentColor: form.input.accentColor,
        hideBranding: form.input.hideBranding,
        monitors: form.input.monitors,
      },
    }),
    [form.input],
  );

  const { isDirty, dirty, markSaved } = useUnsavedChanges(sections);

  const {
    saveMutation,
    publishMutation,
    deleteMutation,
    handleDiscard,
    handleSave,
    handleStudioSave,
    showPublishConfirm,
    setShowPublishConfirm,
    confirmPendingSave,
  } = useStatusPageEditor({ dashboardId, statusPage, form, markSaved, closeStudio });

  const effectiveDirty = isDirty || form.hasStagedImages;

  const handleBackClick = useCallback(
    (event: React.MouseEvent) => {
      if (!effectiveDirty) return;
      event.preventDefault();
      event.stopPropagation();
      setShowLeaveConfirm(true);
    },
    [effectiveDirty],
  );

  const backHref = `/dashboard/${dashboardId}/status-pages`;

  const publicHost = publicBaseUrl.replace(/^https?:\/\//, '');
  const liveCustomDomain = form.input.customDomain;
  const publicUrl = statusPagePublicUrl({ slug: form.slug, customDomain: liveCustomDomain }, publicBaseUrl);
  const savedPublicUrl = statusPagePublicUrl(
    { slug: statusPage.slug, customDomain: statusPage.customDomain },
    publicBaseUrl,
  );
  const { noMonitors, pageInvalid, blockedReason: saveBlockedReason } = useStatusPageValidation(form, slugStatus);
  const saveDisabled = !effectiveDirty || pageInvalid;
  const publishBlocked = effectiveDirty || pageInvalid;
  const publishBlockedReason = effectiveDirty ? t('publishNeedsSave') : t('minMonitorsHint');

  const livePreview = (
    <LivePreview
      payload={previewPayload}
      messages={previewMessages}
      publicHost={publicHost}
      draft={form.previewDraft}
      enlargeable
      enlargedOpen={previewOpen}
      onEnlargedOpenChange={setPreviewOpen}
      className='w-full'
    />
  );

  return (
    <div className={cn(onSettingsTab && 'pb-24 xl:pb-0')}>
      <Link
        href={backHref}
        onClick={handleBackClick}
        className='text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm'
      >
        <ArrowLeft className='h-3.5 w-3.5' />
        {t('back')}
      </Link>

      <div className='min-w-0'>
        <div className='mb-2 flex items-center gap-2.5'>
          <h1 className='truncate text-2xl font-semibold tracking-tight'>{form.name || statusPage.name}</h1>
          <span
            className={cn(
              'inline-flex flex-none items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
              statusPage.isPublished
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-border bg-muted/40 text-muted-foreground',
            )}
          >
            {statusPage.isPublished ? t('statusPublished') : t('statusDraft')}
          </span>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <div className='border-border bg-card flex h-9 items-center rounded-lg border'>
            <span className='flex min-w-0 items-center py-1 pr-2 pl-3'>
              <span className='text-muted-foreground max-w-[55vw] truncate font-mono text-xs sm:max-w-xs'>
                {liveCustomDomain ? (
                  <span className='text-foreground font-medium'>{liveCustomDomain}</span>
                ) : (
                  <>
                    {publicHost}/status/<span className='text-foreground font-medium'>{form.slug}</span>
                  </>
                )}
              </span>
            </span>
            <span aria-hidden className='bg-border h-5 w-px flex-none' />
            <CopyButton
              text={publicUrl}
              ariaLabel={t('copyUrl')}
              copiedLabel={tActions('linkCopied')}
              className='text-muted-foreground hover:text-foreground hover:bg-accent mx-0.5 flex h-7 w-7 flex-none cursor-pointer items-center justify-center rounded-md transition-colors'
              iconClassName='h-3.5 w-3.5'
            />
            {statusPage.isPublished && (
              <a
                href={savedPublicUrl}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={t('viewPage')}
                title={t('viewPage')}
                className='text-muted-foreground hover:text-foreground hover:bg-accent mr-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-md transition-colors'
              >
                <ExternalLink className='h-3.5 w-3.5' />
              </a>
            )}
          </div>

          <Button
            type='button'
            variant='outline'
            onClick={() => setShowStudio(true)}
            className='h-9 cursor-pointer'
          >
            <Pencil className='mr-1.5 h-3.5 w-3.5' />
            {t('editPage')}
            {dirty.studio && <UnsavedDot label={t('unsavedChanges')} />}
          </Button>

          {!statusPage.isPublished && (
            <PermissionGate permission='canPublishStatusPages'>
              {(disabled) => (
                <DisabledTooltip disabled={!disabled && publishBlocked} message={publishBlockedReason}>
                  {() => (
                    <Button
                      type='button'
                      disabled={disabled || publishBlocked || publishMutation.isPending}
                      onClick={() => publishMutation.mutate({ statusPageId: statusPage.id, isPublished: true })}
                      className='h-9 cursor-pointer'
                    >
                      {publishMutation.isPending && <Spinner size='sm' className='mr-1.5 border-current' />}
                      {tActions('publish')}
                    </Button>
                  )}
                </DisabledTooltip>
              )}
            </PermissionGate>
          )}

          {onSettingsTab && (
            <button
              type='button'
              onClick={() => setPreviewOpen(true)}
              className='border-border bg-card text-foreground hover:bg-accent inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors xl:hidden'
            >
              <Maximize2 className='h-3.5 w-3.5' />
              {t('preview')}
            </button>
          )}
        </div>
      </div>

      <UnderlineTabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)} className='mt-6'>
        <div className='border-border overflow-x-auto border-b'>
          <UnderlineTabsList className='border-b-0'>
            <UnderlineTabsTrigger value='incidents'>{t('tabs.incidents')}</UnderlineTabsTrigger>
            <UnderlineTabsTrigger value='settings'>
              {t('tabs.settings')}
              {dirty.settings && <UnsavedDot label={t('unsavedChanges')} />}
            </UnderlineTabsTrigger>
          </UnderlineTabsList>
        </div>

        {activeTab === 'incidents' ? (
          <div className='mt-6'>
            <IncidentsTab dashboardId={dashboardId} statusPageId={statusPage.id} monitors={form.monitorsPayload} />
          </div>
        ) : (
          <div className='mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)] xl:items-start'>
            <div className='space-y-12'>
              <SettingsTab
                form={form}
                slugStatus={slugStatus}
                publicHost={publicHost}
                dashboardDomain={dashboardDomain}
                isPublished={statusPage.isPublished}
                onUnpublish={() => setShowUnpublishConfirm(true)}
                isUnpublishing={publishMutation.isPending}
                onDelete={() => setShowDeleteConfirm(true)}
                isDeleting={deleteMutation.isPending}
              />
            </div>

            <div className='hidden xl:block'>
              <div className='mb-3 flex h-8 items-end justify-end gap-2'>
                {effectiveDirty && (
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
              <div className='xl:sticky xl:top-4'>{livePreview}</div>
            </div>
          </div>
        )}
      </UnderlineTabs>

      {/* bottom-[33px] = the sidebar trigger's bottom-10 (40px) minus this panel's padding+border
          (7px), so the buttons line up vertically with the trigger (bottom-left). */}
      {onSettingsTab && (
        <div className='bg-background border-border fixed right-6 bottom-[33px] z-49 flex h-fit w-fit items-center gap-2 rounded-lg border p-1.5 shadow-lg xl:hidden'>
          <Button
            type='button'
            variant='outline'
            disabled={!effectiveDirty || saveMutation.isPending}
            onClick={handleDiscard}
            className='cursor-pointer'
          >
            {t('discard')}
          </Button>
          <PermissionGate>
            {(disabled) => (
              <Button
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
      )}

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
        onConfirm={confirmPendingSave}
      />

      {showStudio && (
        <EditStatusPageStudio
          dashboardId={dashboardId}
          publicHost={publicHost}
          domain={dashboardDomain}
          form={form}
          slugStatus={slugStatus}
          preview={{ payload: previewPayload, messages: previewMessages }}
          saving={saveMutation.isPending}
          saveBlockedReason={saveBlockedReason}
          onSave={handleStudioSave}
          onClose={closeStudio}
        />
      )}

      <ConfirmDialog
        open={showUnpublishConfirm}
        onOpenChange={setShowUnpublishConfirm}
        title={tActions('unpublishConfirmTitle')}
        description={tActions('unpublishConfirmDescription')}
        confirmLabel={tActions('unpublish')}
        onConfirm={() => {
          setShowUnpublishConfirm(false);
          publishMutation.mutate({ statusPageId: statusPage.id, isPublished: false });
        }}
      />

      <DestructiveActionDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('deleteConfirmTitle')}
        description={t('deleteConfirmDescription')}
        confirmLabel={t('deleteConfirm')}
        cancelLabel={t('cancel')}
        onConfirm={() => deleteMutation.mutate(statusPage.id)}
        isPending={deleteMutation.isPending}
        showIcon
      />
    </div>
  );
}
