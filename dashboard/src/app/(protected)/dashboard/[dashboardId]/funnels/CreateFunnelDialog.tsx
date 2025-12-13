'use client';

import { PlusIcon } from 'lucide-react';
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
import { ComponentProps, useCallback, useMemo, useState } from 'react';
import { postFunnelAction } from '@/app/actions/index.actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { toast } from 'sonner';
import { useFunnelDialog } from '@/hooks/use-funnel-dialog';
import { CreateFunnelSchema } from '@/entities/analytics/funnels.entities';
import { generateTempId } from '@/utils/temporaryId';
import { FunnelDialogContent } from './FunnelDialogContent';

type CreateFunnelDialogProps = {
  triggerText?: string;
  triggerVariant?: ComponentProps<typeof Button>['variant'];
};

export function CreateFunnelDialog({ triggerText, triggerVariant }: CreateFunnelDialogProps) {
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
    updateFunnelStep,
    removeFunnelStep,
    searchableFunnelSteps,
    funnelPreview,
    emptySteps,
    reset,
    isPreviewLoading,
    setFunnelSteps,
  } = useFunnelDialog({
    dashboardId,
    initialName: '',
    initialSteps: [
      { id: generateTempId(), column: 'url', operator: '=', value: '', name: '' },
      { id: generateTempId(), column: 'url', operator: '=', value: '', name: '' },
    ],
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

  const handleCreateFunnel = useCallback(() => {
    setHasAttemptedSubmit(true);
    if (!isCreateValid) {
      return;
    }
    postFunnelAction(dashboardId, metadata.name, funnelSteps, metadata.isStrict)
      .then(() => {
        setHasAttemptedSubmit(false);
        setIsOpen(false);
        toast.success(t('create.successMessage'));
        reset({
          name: '',
          isStrict: false,
          steps: [
            { id: generateTempId(), column: 'url', operator: '=', value: '', name: '' },
            { id: generateTempId(), column: 'url', operator: '=', value: '', name: '' },
          ],
        });
      })
      .catch(() => {
        toast.error(t('create.errorMessage'));
      });
  }, [dashboardId, funnelSteps, isCreateValid, metadata.isStrict, metadata.name, reset, t]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setHasAttemptedSubmit(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={triggerVariant || 'ghost'} className='cursor-pointer'>
          <PlusIcon className='h-4 w-4' />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-background flex max-h-[90dvh] min-h-[70dvh] w-[70dvw] !max-w-[1000px] flex-col'>
        <DialogHeader>
          <DialogTitle>{t('create.createFunnel')}</DialogTitle>
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
            name: t('create.name'),
            namePlaceholder: t('create.namePlaceholder'),
            strictMode: t('create.strictMode'),
            addStep: t('create.addStep'),
            livePreview: t('create.livePreview'),
            defineAtLeastTwoSteps: t('preview.defineAtLeastTwoSteps'),
          }}
        />
        <DialogFooter className='flex items-end justify-end gap-2'>
          <Button variant='default' className='w-30 cursor-pointer' onClick={handleCreateFunnel}>
            {t('create.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
