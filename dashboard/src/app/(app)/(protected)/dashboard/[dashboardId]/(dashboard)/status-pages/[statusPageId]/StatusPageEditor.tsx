'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Maximize2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { UnderlineTabs, UnderlineTabsList, UnderlineTabsTrigger } from '@/components/ui/UnderlineTabs';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { ConfirmDialog, DestructiveActionDialog } from '@/components/dialogs';
import { type StatusPageWithMonitors } from '@/entities/analytics/statusPage/statusPage.entities';
import { statusPagePublicUrl } from '@/entities/analytics/statusPage/statusPage.helpers';
import { cn } from '@/lib/utils';
import { useDashboardNavigation } from '@/contexts/DashboardNavigationContext';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { IncidentsTab } from './tabs/IncidentsTab';
import { LivePreview } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/LivePreview';
import { fetchStatusPageLivePreviewAction } from '@/app/actions/analytics/statusPage.actions';
import { useStatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { type MonitorRow } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/monitorRow';
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
  publicBaseUrl: string;
  dashboardDomain: string;
};

function buildMonitorRows(statusPage: StatusPageWithMonitors): MonitorRow[] {
  return [...statusPage.monitors]
    .sort((a, b) => a.position - b.position)
    .map((selection) => ({
      monitorCheckId: selection.monitorCheckId,
      name: null,
      url: '',
      included: true,
      publicName: selection.publicName,
    }));
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
  publicBaseUrl,
  dashboardDomain,
}: StatusPageEditorProps) {
  const t = useTranslations('statusPagesPage.editor');
  const tActions = useTranslations('statusPagesPage.actions');
  const router = useRouter();
  const { hasPermission } = useDashboardAuth();
  const canManageStatusPages = hasPermission('canManageStatusPages');

  const initialMonitorRows = useMemo(() => buildMonitorRows(statusPage), [statusPage]);
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
  const requestedTab: TabKey = isTabKey(urlTab) ? urlTab : 'incidents';
  const activeTab: TabKey = requestedTab === 'settings' && !canManageStatusPages ? 'incidents' : requestedTab;
  const onSettingsTab = activeTab === 'settings';

  const setActiveTab = useCallback((tab: TabKey) => {
    const params = new URLSearchParams(window.location.search);
    if (tab === 'incidents') params.delete('tab');
    else params.set('tab', tab);
    const query = params.toString();
    // Native replaceState keeps useSearchParams in sync without an RSC refetch or a history entry.
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, []);

  const [showStudio, setShowStudio] = useState(
    () => canManageStatusPages && searchParams.get('studio') === '1',
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const livePreviewQuery = useQuery({
    queryKey: ['statusPageLivePreview', dashboardId, statusPage.id],
    queryFn: () => fetchStatusPageLivePreviewAction(dashboardId, statusPage.id),
    enabled: onSettingsTab,
    staleTime: Infinity,
  });
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

  const sections = useMemo(
    () => ({ settings: form.settingsInput, studio: form.studioInput }),
    [form.settingsInput, form.studioInput],
  );

  const { isDirty, dirty, markSaved } = useUnsavedChanges(sections);
  const { resolveHref } = useDashboardNavigation();

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

  const backHref = resolveHref('status-pages');

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

          {/* No unsaved-dot here: studio fields are only editable inside the studio, and closing
              it forces save-or-discard, so the studio section is always clean on this page. */}
          <PermissionGate permission='canManageStatusPages'>
            {(disabled) => (
              <Button
                type='button'
                variant='outline'
                disabled={disabled}
                onClick={() => setShowStudio(true)}
                className='h-9 cursor-pointer'
              >
                <Pencil className='mr-1.5 h-3.5 w-3.5' />
                {t('editPage')}
              </Button>
            )}
          </PermissionGate>

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
              disabled={!livePreviewQuery.data}
              className='border-border bg-card text-foreground hover:bg-accent inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors disabled:cursor-default disabled:opacity-50 xl:hidden'
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
            <PermissionGate permission='canManageStatusPages'>
              {(disabled) => (
                <UnderlineTabsTrigger value='settings' disabled={disabled}>
                  {t('tabs.settings')}
                  {dirty.settings && <UnsavedDot label={t('unsavedChanges')} />}
                </UnderlineTabsTrigger>
              )}
            </PermissionGate>
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
              <div className='xl:sticky xl:top-4'>
                {livePreviewQuery.data ? (
                  <LivePreview
                    payload={livePreviewQuery.data.payload}
                    messages={livePreviewQuery.data.messages}
                    publicHost={publicHost}
                    draft={form.previewDraft}
                    enlargedOpen={previewOpen}
                    onEnlargedOpenChange={setPreviewOpen}
                    showEnlargeButton
                    fillUrlBar
                    className='w-full'
                  />
                ) : (
                  <div className='bg-card border-border flex h-72 items-center justify-center rounded-xl border'>
                    {livePreviewQuery.isPending ? (
                      <Spinner size='sm' />
                    ) : (
                      <p className='text-muted-foreground text-sm'>{t('error')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </UnderlineTabs>

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
          statusPageId={statusPage.id}
          publicHost={publicHost}
          domain={dashboardDomain}
          form={form}
          slugStatus={slugStatus}
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
