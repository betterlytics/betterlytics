'use client';

import { Copy } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
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
import { toast } from 'sonner';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useFunnelDialog } from '@/hooks/use-funnel-dialog';
import { CreateFunnelSchema } from '@/entities/analytics/funnels.entities';
import { PresentedFunnel } from '@/presenters/toFunnel';
import { postFunnelAction } from '@/app/actions/index.actions';
import { generateTempId } from '@/utils/temporaryId';
import { FunnelDialogContent } from './FunnelDialogContent';

type CloneFunnelDialogProps = {
  funnel: PresentedFunnel;
  disabled?: boolean;
};

export function CloneFunnelDialog({ funnel, disabled }: CloneFunnelDialogProps) {
  const t = useTranslations('components.funnels.clone');
  const dashboardId = useDashboardId();
  const [isOpen, setIsOpen] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

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
    initialName: `${funnel.name} (copy)`,
    initialIsStrict: funnel.isStrict,
    initialSteps: funnel.steps.map(({ step }) => ({ ...step, id: generateTempId() })),
  });

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

  const handleCloneFunnel = useCallback(() => {
    setHasAttemptedSubmit(true);
    if (!isCreateValid) return;

    postFunnelAction(dashboardId, metadata.name, funnelSteps, metadata.isStrict)
      .then(() => {
        setIsOpen(false);
        setHasAttemptedSubmit(false);
        toast.success(t('successMessage'));
      })
      .catch(() => {
        toast.error(t('errorMessage'));
      });
  }, [dashboardId, funnelSteps, isCreateValid, metadata.isStrict, metadata.name, t]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      reset({
        name: `${funnel.name} (copy)`,
        isStrict: funnel.isStrict,
        steps: funnel.steps.map(({ step }) => ({ ...step, id: generateTempId() })),
      });
      return;
    }
    setHasAttemptedSubmit(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='ghost' className='cursor-pointer' disabled={disabled}>
          <Copy className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-background flex max-h-[90dvh] min-h-[70dvh] w-[70dvw] !max-w-[1000px] flex-col'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
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
            name: t('name'),
            namePlaceholder: t('namePlaceholder'),
            strictMode: t('strictMode'),
            addStep: t('addStep'),
            livePreview: t('livePreview'),
            defineAtLeastTwoSteps: t('defineAtLeastTwoSteps'),
          }}
        />
        <DialogFooter className='flex items-end justify-end gap-2'>
          <Button variant='outline' className='w-30 cursor-pointer' onClick={() => setIsOpen(false)}>
            {t('cancel')}
          </Button>
          <Button variant='default' className='w-30 cursor-pointer' onClick={handleCloneFunnel}>
            {t('cta')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
