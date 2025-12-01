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
import { updateFunnelAction } from '@/app/actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { PresentedFunnel } from '@/presenters/toFunnel';
import { useFunnelDialog } from '@/hooks/use-funnel-dialog';
import { UpdateFunnelSchema } from '@/entities/funnels';
import { toast } from 'sonner';
import { FunnelDialogContent } from './FunnelDialogContent';

type EditFunnelDialogProps = {
  funnel: PresentedFunnel;
};

export function EditFunnelDialog({ funnel }: EditFunnelDialogProps) {
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
        reset();
        setHasAttemptedSubmit(false);
      }
      setIsOpen(open);
    },
    [reset],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='ghost' className='cursor-pointer'>
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
          <Button
            variant='outline'
            className='w-30 cursor-pointer'
            onClick={() => {
              reset();
              setIsOpen(false);
            }}
          >
            {t('edit.cancel')}
          </Button>

          <Button variant='default' className='w-30 cursor-pointer' onClick={handleEditFunnel}>
            {t('edit.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
