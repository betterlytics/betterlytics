'use client';

import { Copy } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useFunnelDialog } from '@/hooks/use-funnel-dialog';
import { useOverlayReset } from '@/hooks/use-overlay-reset';
import { CreateFunnelSchema } from '@/entities/analytics/funnels.entities';
import { PresentedFunnel } from '@/presenters/toFunnel';
import { postFunnelAction } from '@/app/actions/index.actions';
import { trpc } from '@/trpc/client';
import { generateTempId } from '@/utils/temporaryId';
import { FunnelDialogContent } from './FunnelDialogContent';
import { FunnelDialogLayout } from './FunnelDialogLayout';

type CloneFunnelDialogProps = {
  funnel: PresentedFunnel;
  disabled?: boolean;
};

export function CloneFunnelDialog({ funnel, disabled }: CloneFunnelDialogProps) {
  const t = useTranslations('components.funnels.clone');
  const dashboardId = useDashboardId();
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const dialog = useFunnelDialog({
    dashboardId,
    initialName: `${funnel.name} (copy)`,
    initialIsStrict: funnel.isStrict,
    initialSteps: funnel.steps.map(({ step }) => ({
      ...step,
      id: generateTempId(),
      filters: step.filters.map((f) => ({ ...f, id: generateTempId() })),
    })),
  });
  const { metadata, funnelSteps, reset } = dialog;

  const isCreateValid = useMemo(
    () =>
      CreateFunnelSchema.safeParse({
        name: metadata.name,
        dashboardId,
        isStrict: metadata.isStrict,
        funnelSteps,
      }).success,
    [dashboardId, funnelSteps, metadata.isStrict, metadata.name],
  );

  const { markPending, onAnimationEnd } = useOverlayReset(() => {
    setHasAttemptedSubmit(false);
    reset({
      name: `${funnel.name} (copy)`,
      isStrict: funnel.isStrict,
      steps: funnel.steps.map(({ step }) => ({
        ...step,
        id: generateTempId(),
        filters: step.filters.map((f) => ({ ...f, id: generateTempId() })),
      })),
    });
  });

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setHasAttemptedSubmit(false);
      reset({
        name: `${funnel.name} (copy)`,
        isStrict: funnel.isStrict,
        steps: funnel.steps.map(({ step }) => ({
          ...step,
          id: generateTempId(),
          filters: step.filters.map((f) => ({ ...f, id: generateTempId() })),
        })),
      });
    } else {
      markPending();
    }
    setIsOpen(open);
  };

  const handleCloneFunnel = useCallback(() => {
    setHasAttemptedSubmit(true);
    if (!isCreateValid) return;

    postFunnelAction(dashboardId, metadata.name, funnelSteps, metadata.isStrict)
      .then(() => {
        markPending();
        setIsOpen(false);
        toast.success(t('successMessage'));
        utils.funnels.list.invalidate({ dashboardId });
      })
      .catch(() => {
        toast.error(t('errorMessage'));
      });
  }, [dashboardId, funnelSteps, isCreateValid, markPending, metadata.isStrict, metadata.name, t, utils]);

  return (
    <FunnelDialogLayout
      open={isOpen}
      onOpenChange={handleOpenChange}
      onAnimationEnd={onAnimationEnd}
      title={t('title')}
      trigger={
        <Button variant='ghost' className='cursor-pointer' disabled={disabled}>
          <Copy className='h-4 w-4' />
        </Button>
      }
      footer={
        <>
          <Button variant='outline' className='w-30 cursor-pointer' onClick={() => handleOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button variant='default' className='w-30 cursor-pointer' onClick={handleCloneFunnel}>
            {t('cta')}
          </Button>
        </>
      }
    >
      <FunnelDialogContent
        dialog={dialog}
        hasAttemptedSubmit={hasAttemptedSubmit}
        initialOpenId={undefined}
        labels={{
          name: t('name'),
          namePlaceholder: t('namePlaceholder'),
          strictMode: t('strictMode'),
          addStep: t('addStep'),
        }}
      />
    </FunnelDialogLayout>
  );
}
