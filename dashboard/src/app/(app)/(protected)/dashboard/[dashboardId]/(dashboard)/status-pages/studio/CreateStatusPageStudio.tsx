'use client';

import { useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { STATUS_PAGE_DEFAULT_ACCENT_COLOR } from '@/entities/analytics/statusPage/statusPage.entities';
import { useDashboardNavigation } from '@/contexts/DashboardNavigationContext';
import {
  createStatusPageAction,
  fetchStatusPageDraftPreviewAction,
  suggestStatusPageDefaultsAction,
} from '@/app/actions/analytics/statusPage.actions';
import { FlowOverlay } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/FlowOverlay';
import { FlowOverlayHeader } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/FlowOverlayHeader';
import { collectStagedImages } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/collectStagedImages';
import { useStatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { useSlugAvailability } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useSlugAvailability';
import { useStatusPageValidation } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageValidation';
import { StudioShell } from './StudioShell';

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
  const { resolveHref } = useDashboardNavigation();

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
      included: false,
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
      router.push(resolveHref(`status-pages/${page.id}`));
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

  return (
    <StudioShell
      mode='create'
      dashboardId={dashboardId}
      publicHost={publicHost}
      domain={domain}
      form={form}
      slugStatus={slugStatus}
      preview={previewQuery.data ?? null}
      previewError={previewQuery.isError}
      previewDisabled={!previewQuery.data}
      buttons={commitButtons}
      busy={commitMutation.isPending}
      isDirty={isDirty}
      discardLabels={{
        title: t('wizard.confirmDiscard.title'),
        description: t('wizard.confirmDiscard.description'),
        keep: t('wizard.confirmDiscard.keep'),
        discard: t('wizard.confirmDiscard.discard'),
      }}
      onClose={onClose}
      onMonitorCreated={() => previewQuery.refetch()}
    />
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
