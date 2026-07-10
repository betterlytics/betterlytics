'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { STATUS_PAGE_DEFAULT_ACCENT_COLOR } from '@/entities/analytics/statusPage/statusPage.entities';
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
import {
  newMonitorRow,
  useStatusPageFormState,
} from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { useSlugAvailability } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useSlugAvailability';
import { useStatusPageValidation } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageValidation';
import { StatusPageStudio } from './StatusPageStudio';

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
  publicBaseUrl,
  domain,
  defaults,
  onClose,
}: CreateStatusPageStudioProps & { defaults: StudioDefaults }) {
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

  const commitMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const images = await collectStagedImages(form);
      const page = await createStatusPageAction(dashboardId, { ...form.input, isPublished: publish }, images);
      return { page, publish };
    },
    onSuccess: ({ page, publish }) => {
      if (publish) {
        toast.success(t('publishSuccess.title'), {
          action: {
            label: t('publishSuccess.view'),
            onClick: () => window.open(`${publicBaseUrl}/status/${page.slug}`, '_blank', 'noopener,noreferrer'),
          },
        });
      }
      router.push(`/dashboard/${dashboardId}/status-pages/${page.id}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const { pageInvalid, blockedReason: commitBlockReason } = useStatusPageValidation(form, slugStatus, {
    monitorsMessage: t('wizard.minMonitors'),
  });
  const canCommit = !pageInvalid && !commitMutation.isPending;
  const submittingPublish = commitMutation.isPending && commitMutation.variables === true;
  const submittingDraft = commitMutation.isPending && commitMutation.variables === false;

  const initialSnapshotRef = useRef(form.snapshot);
  const isDirty = useMemo(
    () => form.hasStagedImages || JSON.stringify(form.snapshot) !== JSON.stringify(initialSnapshotRef.current),
    [form.snapshot, form.hasStagedImages],
  );

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
      <PermissionGate permission='canPublishStatusPages'>
        {(permissionDisabled) =>
          !permissionDisabled && !canCommit && commitBlockReason ? (
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
          ) : (
            <Button
              size={size}
              disabled={permissionDisabled || !canCommit}
              onClick={() => commitMutation.mutate(true)}
              className='cursor-pointer'
            >
              {submittingPublish && <Spinner size='sm' className='mr-1.5 border-current' />}
              {t('publish')}
            </Button>
          )
        }
      </PermissionGate>
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
          form.setMonitorRows((rows) => [...rows, newMonitorRow(monitor)]);
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
  const defaultsQuery = useQuery({
    queryKey: ['statusPageDefaults', dashboardId],
    queryFn: () => suggestStatusPageDefaultsAction(dashboardId),
    staleTime: 0,
    gcTime: 0,
  });

  return (
    <FlowOverlay>
      {defaultsQuery.data ? (
        <StudioForm
          dashboardId={dashboardId}
          publicHost={publicHost}
          publicBaseUrl={publicBaseUrl}
          domain={domain}
          defaults={defaultsQuery.data}
          onClose={onClose}
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
