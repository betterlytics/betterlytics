'use client';

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { updateFunnelAction } from '@/app/actions/index.actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { trpc } from '@/trpc/client';
import { PresentedFunnel } from '@/presenters/toFunnel';
import { useFunnelDialog } from '@/hooks/use-funnel-dialog';
import { UpdateFunnelSchema, type FunnelStep } from '@/entities/analytics/funnels.entities';
import { toast } from 'sonner';
import { FunnelDialogContent } from './FunnelDialogContent';
import { FunnelDialogLayout } from './FunnelDialogLayout';
import { stableStringify } from '@/utils/stableStringify';

type EditFunnelDialogProps = {
  funnel: PresentedFunnel;
  disabled?: boolean;
};

const areFunnelStepsEqual = (a: FunnelStep[], b: FunnelStep[]): boolean => {
  if (a.length !== b.length) return false;

  return a.every((step, index) => {
    const other = b[index];
    return stableStringify(step) === stableStringify(other);
  });
};

export function EditFunnelDialog({ funnel, disabled }: EditFunnelDialogProps) {
  const t = useTranslations('components.funnels');
  const [isOpen, setIsOpen] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const dashboardId = useDashboardId();
  const utils = trpc.useUtils();
  const dialog = useFunnelDialog({
    dashboardId,
    initialName: funnel.name,
    initialIsStrict: funnel.isStrict,
    initialSteps: funnel.steps.map((step) => step.step),
  });
  const { metadata, funnelSteps, reset } = dialog;

  const isEditValid = useMemo(
    () =>
      UpdateFunnelSchema.safeParse({
        id: funnel.id,
        name: metadata.name,
        dashboardId,
        isStrict: metadata.isStrict,
        funnelSteps,
      }).success,
    [dashboardId, funnel.id, funnelSteps, metadata.isStrict, metadata.name],
  );

  const isDirty = useMemo(() => {
    const initialSteps = funnel.steps.map((step) => step.step);

    if (metadata.name !== funnel.name) return true;
    if (metadata.isStrict !== funnel.isStrict) return true;
    if (!areFunnelStepsEqual(funnelSteps, initialSteps)) return true;

    return false;
  }, [funnel, funnelSteps, metadata.isStrict, metadata.name]);

  const handleEditFunnel = useCallback(() => {
    setHasAttemptedSubmit(true);
    if (!isEditValid) {
      return;
    }
    return updateFunnelAction(dashboardId, {
      id: funnel.id,
      dashboardId,
      name: metadata.name,
      funnelSteps,
      isStrict: metadata.isStrict,
    })
      .then(() => {
        setIsOpen(false);
        setHasAttemptedSubmit(false);
        toast.success(t('edit.successMessage'));
        utils.funnels.list.invalidate({ dashboardId });
        utils.funnels.details.invalidate({ dashboardId, funnelId: funnel.id });
      })
      .catch(() => {
        toast.error(t('edit.errorMessage'));
      });
  }, [dashboardId, funnel.id, funnelSteps, metadata.isStrict, metadata.name, t, utils]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setHasAttemptedSubmit(false);
        reset({
          name: funnel.name,
          isStrict: funnel.isStrict,
          steps: funnel.steps.map((s) => s.step),
        });
      }
      setIsOpen(open);
    },
    [funnel, reset],
  );

  return (
    <FunnelDialogLayout
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={t('edit.title')}
      trigger={
        <Button variant='ghost' className='cursor-pointer' disabled={disabled}>
          <Pencil className='h-4 w-4' />
        </Button>
      }
      footer={
        <>
          <Button variant='outline' className='w-30 cursor-pointer' onClick={() => setIsOpen(false)}>
            {t('edit.cancel')}
          </Button>
          <Button variant='default' className='w-30 cursor-pointer' onClick={handleEditFunnel} disabled={!isDirty}>
            {t('edit.save')}
          </Button>
        </>
      }
    >
      <FunnelDialogContent
        dialog={dialog}
        hasAttemptedSubmit={hasAttemptedSubmit}
        initialOpenId={undefined}
        labels={{
          name: t('edit.name'),
          strictMode: t('edit.strictMode'),
          addStep: t('edit.addStep'),
        }}
      />
    </FunnelDialogLayout>
  );
}
