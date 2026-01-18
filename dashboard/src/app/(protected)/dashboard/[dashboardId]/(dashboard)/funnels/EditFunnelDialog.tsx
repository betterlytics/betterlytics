'use client';

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { updateFunnelAction } from '@/app/actions/index.actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { PresentedFunnel } from '@/presenters/toFunnel';
import { useFunnelDialog } from '@/hooks/use-funnel-dialog';
import { UpdateFunnelSchema, type FunnelStep } from '@/entities/analytics/funnels.entities';
import { toast } from 'sonner';
import { FunnelDialogContent } from './FunnelDialogContent';
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
  const {
    metadata,
    setName,
    setIsStrict,
    funnelSteps,
    addEmptyFunnelStep,
    setFunnelSteps,
    updateFunnelStep,
    removeFunnelStep,
    searchableFunnelSteps,
    funnelPreview,
    emptySteps,
    isPreviewLoading,
    reset,
  } = useFunnelDialog({
    dashboardId,
    initialName: funnel.name,
    initialIsStrict: funnel.isStrict,
    initialSteps: funnel.steps.map((step) => step.step),
  });

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
      })
      .catch(() => {
        toast.error(t('edit.errorMessage'));
      });
  }, [dashboardId, funnel.id, funnelSteps, metadata.isStrict, metadata.name, t, reset]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setHasAttemptedSubmit(false);
      }
      setIsOpen(open);
      if (open) {
        reset({
          name: funnel.name,
          isStrict: funnel.isStrict,
          steps: funnel.steps.map((s) => s.step),
        });
      }
    },
    [funnel, reset],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='ghost' className='cursor-pointer' disabled={disabled}>
          <Pencil className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-background flex max-h-[90dvh] min-h-[70dvh] w-[70dvw] !max-w-[1000px] flex-col'>
        <DialogHeader>
          <DialogTitle>{t('edit.title')}</DialogTitle>
        </DialogHeader>
        <FunnelDialogContent
          metadata={metadata}
          setName={setName}
          setIsStrict={setIsStrict}
          funnelSteps={funnelSteps}
          addEmptyFunnelStep={addEmptyFunnelStep}
          setFunnelSteps={setFunnelSteps}
          updateFunnelStep={updateFunnelStep}
          removeFunnelStep={removeFunnelStep}
          searchableFunnelSteps={searchableFunnelSteps}
          funnelPreview={funnelPreview}
          emptySteps={emptySteps}
          isPreviewLoading={isPreviewLoading}
          hasAttemptedSubmit={hasAttemptedSubmit}
          labels={{
            name: t('edit.name'),
            strictMode: t('edit.strictMode'),
            addStep: t('edit.addStep'),
            livePreview: t('edit.livePreview'),
            defineAtLeastTwoSteps: t('preview.defineAtLeastTwoSteps'),
          }}
        />
        <DialogFooter className='flex items-end justify-end gap-2'>
          <Button variant='outline' className='w-30 cursor-pointer' onClick={() => setIsOpen(false)}>
            {t('edit.cancel')}
          </Button>

          <Button variant='default' className='w-30 cursor-pointer' onClick={handleEditFunnel} disabled={!isDirty}>
            {t('edit.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
