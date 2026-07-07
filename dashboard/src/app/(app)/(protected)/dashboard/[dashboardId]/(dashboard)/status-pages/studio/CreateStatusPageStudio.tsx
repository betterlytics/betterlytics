'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { STATUS_PAGE_DEFAULT_ACCENT_COLOR } from '@/entities/analytics/statusPage/statusPage.entities';
import { defaultPublicMonitorName } from '@/entities/analytics/statusPage/statusPage.helpers';
import { ConfirmDialog } from '@/components/dialogs';
import {
  createStatusPageAction,
  fetchStatusPageDraftPreviewAction,
  suggestStatusPageDefaultsAction,
} from '@/app/actions/analytics/statusPage.actions';
import { MonitorFormDialog } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/MonitorFormDialog';
import { FlowOverlay } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/FlowOverlay';
import { FlowOverlayHeader } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/FlowOverlayHeader';
import { collectStagedImages } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/collectStagedImages';
import { useStatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { useSlugAvailability } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useSlugAvailability';
import { StatusPageStudio } from './StatusPageStudio';
import { PublishSuccessDialog } from './PublishSuccess';

type StudioDefaults = Awaited<ReturnType<typeof suggestStatusPageDefaultsAction>>;

type CreateStatusPageStudioProps = {
  dashboardId: string;
  publicHost: string;
  publicBaseUrl: string;
  domain: string;
  onClose: () => void;
};

function StudioForm({
  dashboardId,
  publicHost,
  domain,
  defaults,
  onClose,
  onPublished,
}: Omit<CreateStatusPageStudioProps, 'publicBaseUrl'> & {
  defaults: StudioDefaults;
  /** Publish committed: the parent drops this whole overlay and shows the success dialog. */
  onPublished: (page: { id: string; slug: string }) => void;
}) {
  const t = useTranslations('statusPagesPage.editor');
  const router = useRouter();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [createMonitorOpen, setCreateMonitorOpen] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const form = useStatusPageFormState({
    name: defaults.name,
    slug: defaults.slug,
    theme: 'system',
    accentColor: STATUS_PAGE_DEFAULT_ACCENT_COLOR,
    showPastIncidents: true,
    visibility: 'public',
    monitorRows: defaults.monitors.map((monitor) => ({
      monitorCheckId: monitor.monitorCheckId,
      name: monitor.name,
      url: monitor.url,
      included: true,
      publicName: monitor.publicName,
      operationalState: monitor.operationalState,
      uptimePercent: monitor.uptimePercent,
    })),
  });
  const slugStatus = useSlugAvailability({ dashboardId, slug: form.slug });

  // Create + publish is ONE action call carrying `isPublished`, committed as a single
  // insert — a publish can never leave behind an accidentally-unpublished page.
  const commitMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const images = await collectStagedImages(form);
      const page = await createStatusPageAction(dashboardId, { ...form.input, isPublished: publish }, images);
      return { page, publish };
    },
    onSuccess: ({ page, publish }) => {
      if (publish) {
        onPublished({ id: page.id, slug: page.slug });
      } else {
        router.push(`/dashboard/${dashboardId}/status-pages/${page.id}`);
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const slugBlocked = slugStatus === 'taken' || slugStatus === 'invalid';
  const hasMonitors = form.includedCount > 0;
  const canCommit =
    hasMonitors &&
    !form.isNameEmpty &&
    !slugBlocked &&
    form.isHomepageUrlValid &&
    form.isCustomDomainValid &&
    !commitMutation.isPending;
  const commitBlockReason = !hasMonitors
    ? t('wizard.minMonitors')
    : form.isNameEmpty
      ? t('nameRequired')
      : slugBlocked
        ? t(`slugStatus.${slugStatus}`)
        : !form.isHomepageUrlValid
          ? t('homepageUrlInvalid')
          : !form.isCustomDomainValid
            ? t('customDomainInvalid')
            : null;
  const submittingPublish = commitMutation.isPending && commitMutation.variables === true;
  const submittingDraft = commitMutation.isPending && commitMutation.variables === false;

  const monitorsDirty =
    form.monitorRows.length !== defaults.monitors.length ||
    form.monitorRows.some((row, i) => {
      const def = defaults.monitors[i];
      return (
        !def || row.monitorCheckId !== def.monitorCheckId || !row.included || row.publicName !== def.publicName
      );
    });

  const isDirty =
    form.name !== defaults.name ||
    form.slug !== defaults.slug ||
    form.theme !== 'system' ||
    form.accentColor !== STATUS_PAGE_DEFAULT_ACCENT_COLOR ||
    !form.showPastIncidents ||
    form.visibility !== 'public' ||
    form.homepageUrl.trim() !== '' ||
    form.customDomain.trim() !== '' ||
    form.hasStagedImages ||
    monitorsDirty;

  const handleClose = useCallback(() => {
    if (commitMutation.isPending) return;
    if (showDiscardConfirm) return;
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }, [commitMutation.isPending, showDiscardConfirm, isDirty, onClose]);

  const previewQuery = useQuery({
    queryKey: ['statusPageDraftPreview', dashboardId],
    queryFn: () => fetchStatusPageDraftPreviewAction(dashboardId),
    staleTime: Infinity,
    gcTime: 0,
  });

  const commitButtons = (size: 'sm' | 'default') => (
    <>
      <Button
        variant='outline'
        size={size}
        disabled={!canCommit}
        onClick={() => commitMutation.mutate(false)}
        className='cursor-pointer'
      >
        {submittingDraft && <Spinner size='sm' className='mr-1.5 border-current' />}
        {t('wizard.saveDraft')}
      </Button>
      {canCommit || !commitBlockReason ? (
        <Button
          size={size}
          disabled={!canCommit}
          onClick={() => commitMutation.mutate(true)}
          className='cursor-pointer'
        >
          {submittingPublish && <Spinner size='sm' className='mr-1.5 border-current' />}
          {t('publish')}
        </Button>
      ) : (
        <Tooltip>
          {/* Disabled buttons swallow pointer events, so the tooltip hangs off a wrapper. */}
          <TooltipTrigger asChild>
            <span tabIndex={0} className='inline-flex'>
              <Button size={size} disabled className='pointer-events-none'>
                {t('publish')}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side='bottom'>{commitBlockReason}</TooltipContent>
        </Tooltip>
      )}
    </>
  );

  const headerActions = (
    <>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => setPreviewOpen(true)}
        disabled={!previewQuery.data}
        className='cursor-pointer lg:hidden'
      >
        <Maximize2 className='mr-1.5 h-3.5 w-3.5' />
        {t('preview')}
      </Button>
      <div className='hidden items-center gap-2 lg:flex'>{commitButtons('sm')}</div>
    </>
  );

  const mobileBar = (
    <div className='border-border flex flex-none items-center justify-end gap-2 border-t p-3 lg:hidden'>
      {commitButtons('default')}
    </div>
  );

  return (
    <>
      <StatusPageStudio
        mode='create'
        form={form}
        slugStatus={slugStatus}
        publicHost={publicHost}
        domain={domain}
        preview={previewQuery.data ?? null}
        previewError={previewQuery.isError}
        headerActions={headerActions}
        mobileBar={mobileBar}
        onClose={handleClose}
        onCreateMonitor={() => setCreateMonitorOpen(true)}
        previewEnlargedOpen={previewOpen}
        onPreviewEnlargedOpenChange={setPreviewOpen}
      />
      <MonitorFormDialog
        open={createMonitorOpen}
        onOpenChange={setCreateMonitorOpen}
        dashboardId={dashboardId}
        domain={domain}
        existingUrls={form.monitorRows.map((row) => row.url)}
        onCreated={(monitor) => {
          form.setMonitorRows((rows) => [
            ...rows,
            {
              monitorCheckId: monitor.id,
              name: monitor.name ?? null,
              url: monitor.url,
              included: true,
              publicName: defaultPublicMonitorName(monitor),
              operationalState: 'preparing',
              uptimePercent: null,
            },
          ]);
          previewQuery.refetch();
        }}
      />
      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title={t('wizard.confirmDiscard.title')}
        description={t('wizard.confirmDiscard.description')}
        cancelLabel={t('wizard.confirmDiscard.keep')}
        confirmLabel={t('wizard.confirmDiscard.discard')}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose();
        }}
      />
    </>
  );
}

export function CreateStatusPageStudio({
  dashboardId,
  publicHost,
  publicBaseUrl,
  domain,
  onClose,
}: CreateStatusPageStudioProps) {
  const t = useTranslations('statusPagesPage.editor');
  const router = useRouter();
  const [published, setPublished] = useState<{ id: string; slug: string } | null>(null);
  const defaultsQuery = useQuery({
    queryKey: ['statusPageDefaults', dashboardId],
    queryFn: () => suggestStatusPageDefaultsAction(dashboardId),
    staleTime: 0,
    gcTime: 0,
  });

  // The page exists and is live: the studio has nothing left to edit, so the overlay goes
  // away entirely and a small success dialog sits over the (refreshed) list instead.
  if (published) {
    return (
      <PublishSuccessDialog
        dashboardId={dashboardId}
        created={published}
        publicHost={publicHost}
        publicBaseUrl={publicBaseUrl}
        onClose={() => {
          onClose();
          router.refresh();
        }}
      />
    );
  }

  return (
    <FlowOverlay>
      {defaultsQuery.data ? (
        <StudioForm
          dashboardId={dashboardId}
          publicHost={publicHost}
          domain={domain}
          defaults={defaultsQuery.data}
          onClose={onClose}
          onPublished={setPublished}
        />
      ) : (
        <>
          <FlowOverlayHeader title={t('wizard.title')} closeAriaLabel={t('wizard.close')} onClose={onClose} />
          <div className='flex flex-1 items-center justify-center py-20'>
            {defaultsQuery.isError ? <p className='text-muted-foreground text-sm'>{t('error')}</p> : <Spinner />}
          </div>
        </>
      )}
    </FlowOverlay>
  );
}
