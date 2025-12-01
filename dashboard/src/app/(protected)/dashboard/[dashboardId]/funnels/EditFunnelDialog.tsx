'use client';

import { Pencil, PlusIcon } from 'lucide-react';
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
import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { FunnelStepFilter } from './FunnelStepFilter';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { PresentedFunnel } from '@/presenters/toFunnel';
import { useFunnelDialog } from '@/hooks/use-funnel-dialog';
import { UpdateFunnelSchema, type FunnelStep } from '@/entities/funnels';
import { Reorder } from 'motion/react';
import { toast } from 'sonner';

type EditFunnelDialogProps = {
  funnel: PresentedFunnel;
};

const areFunnelStepsEqual = (a: FunnelStep[], b: FunnelStep[]): boolean => {
  if (a.length !== b.length) return false;

  return a.every((step, index) => {
    const other = b[index];
    return (
      step.id === other.id &&
      step.column === other.column &&
      step.operator === other.operator &&
      step.value === other.value &&
      step.name === other.name
    );
  });
};

export function EditFunnelDialog({ funnel }: EditFunnelDialogProps) {
  const t = useTranslations('components.funnels');
  const [isOpen, setIsOpen] = useState(false);
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
    return updateFunnelAction(dashboardId, {
      id: funnel.id,
      dashboardId,
      name: metadata.name,
      funnelSteps,
      isStrict: metadata.isStrict,
    })
      .then(() => {
        setIsOpen(false);
        toast.success(t('edit.successMessage'));
      })
      .catch(() => {
        toast.error(t('edit.errorMessage'));
      });
  }, [dashboardId, funnel.id, funnelSteps, metadata.isStrict, metadata.name, t]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
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
        <Button variant='ghost' className='cursor-pointer'>
          <Pencil className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-background flex h-[90dvh] w-[70dvw] !max-w-[1000px] flex-col'>
        <DialogHeader>
          <DialogTitle>{t('edit.title')}</DialogTitle>
        </DialogHeader>
        <div className='scrollbar-thin bg-card flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg'>
          <div className='flex flex-1 flex-col'>
            <div className='flex flex-1 flex-col gap-4 rounded-lg p-4'>
              <div className='flex w-full justify-between'>
                <div className='flex gap-4'>
                  <div className='max-w-md min-w-40'>
                    <Label htmlFor='name' className='text-foreground mb-1 block'>
                      {t('edit.name')}
                    </Label>
                    <Input id='name' value={metadata.name} onChange={(evt) => setName(evt.target.value)} />
                  </div>
                  <div className='flex items-end'>
                    <div className='flex h-9 items-center gap-2 rounded-lg px-2'>
                      <Label htmlFor='name' className='text-foreground'>
                        {t('edit.strictMode')}
                      </Label>
                      <Switch id='strict-mode' checked={metadata.isStrict} onCheckedChange={setIsStrict} />
                    </div>
                  </div>
                </div>
                <div className='flex items-end'>
                  <Button
                    variant='outline'
                    onClick={addEmptyFunnelStep}
                    className='cursor-pointer whitespace-nowrap'
                  >
                    <PlusIcon className='mr-2 h-4 w-4' /> {t('edit.addStep')}
                  </Button>
                </div>
              </div>
              <Reorder.Group axis='y' values={funnelSteps} onReorder={setFunnelSteps} className='space-y-2'>
                {funnelSteps.map((step, i) => (
                  <Reorder.Item
                    key={step.id}
                    value={step}
                    className='dark:border-border bg-card border-foreground/30 relative flex cursor-move items-center rounded-md border pl-4'
                  >
                    <div className='dark:border-border border-foreground/30 bg-card absolute -left-3 flex size-4 items-center justify-center rounded-full border p-3 shadow'>
                      <p className='text-muted-foreground text-sm font-medium'>{i + 1}</p>
                    </div>
                    <FunnelStepFilter
                      onFilterUpdate={updateFunnelStep}
                      filter={step}
                      requestRemoval={() => removeFunnelStep(step.id)}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
            {searchableFunnelSteps.length < 2 && (
              <div className='text-muted-foreground flex flex-1 items-center justify-center p-4'>
                <p>{t('preview.defineAtLeastTwoSteps')}</p>
              </div>
            )}
            {searchableFunnelSteps.length >= 2 &&
              (!isPreviewLoading && funnelPreview ? (
                <div className='space-y-4 rounded-lg p-4'>
                  <Label htmlFor='name' className='text-foreground mb-2 block'>
                    {t('edit.livePreview')}
                  </Label>
                  <FunnelBarplot funnel={funnelPreview} emptySteps={emptySteps} />
                </div>
              ) : (
                <section className='space-y-3'>
                  <div className='bg-muted h-6 w-48 animate-pulse rounded' />
                  <div className='bg-muted h-40 w-full animate-pulse rounded' />
                </section>
              ))}
          </div>
        </div>
        <DialogFooter className='flex items-end justify-end gap-2'>
          <Button variant='outline' className='w-30 cursor-pointer' onClick={() => setIsOpen(false)}>
            {t('edit.cancel')}
          </Button>
          <DisabledTooltip
            disabled={!isEditValid || !isDirty}
            message={t.rich('edit.disabledHint', { br: () => <br className='block' /> })}
          >
            {(isDisabled) => (
              <Button
                variant='default'
                className='w-30 cursor-pointer'
                onClick={handleEditFunnel}
                disabled={isDisabled}
              >
                {t('edit.save')}
              </Button>
            )}
          </DisabledTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
