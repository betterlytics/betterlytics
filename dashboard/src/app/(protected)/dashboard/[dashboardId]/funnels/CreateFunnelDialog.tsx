'use client';

import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { ComponentProps, useCallback, useMemo, useState } from 'react';
import { postFunnelAction } from '@/app/actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { FunnelStepFilter } from './FunnelStepFilter';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useFunnelDialog } from '@/hooks/use-funnel-dialog';
import { CreateFunnelSchema } from '@/entities/funnels';
import { generateTempId } from '@/utils/temporaryId';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { Reorder } from 'motion/react';

type CreateFunnelDialogProps = {
  triggerText?: string;
  triggerVariant?: ComponentProps<typeof Button>['variant'];
};

export function CreateFunnelDialog({ triggerText, triggerVariant }: CreateFunnelDialogProps) {
  const t = useTranslations('components.funnels.create');
  const tPreview = useTranslations('components.funnels.preview');
  const [isOpen, setIsOpen] = useState(false);
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
    postFunnelAction(dashboardId, metadata.name, funnelSteps, metadata.isStrict)
      .then(() => {
        reset();
        setIsOpen(false);
        toast.success(t('successMessage'));
      })
      .catch(() => {
        toast.error(t('errorMessage'));
      });
  }, [dashboardId, funnelSteps, metadata.isStrict, metadata.name, t]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant || 'ghost'} className='cursor-pointer'>
          <PlusIcon className='h-4 w-4' />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-background flex max-h-[90dvh] min-h-[70dvh] w-[70dvw] !max-w-[1000px] flex-col'>
        <DialogHeader>
          <DialogTitle>{t('createFunnel')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className='scrollbar-thin bg-card flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg'>
          <div className='flex flex-1 flex-col'>
            <div className='flex flex-1 flex-col gap-4 rounded-lg p-4 shadow'>
              <div className='flex w-full justify-between'>
                <div className='flex gap-4'>
                  <div className='max-w-md min-w-40'>
                    <Label htmlFor='name' className='text-foreground mb-1 block'>
                      {t('name')}
                    </Label>
                    <Input
                      id='name'
                      placeholder={t('namePlaceholder')}
                      value={metadata.name}
                      onChange={(evt) => setName(evt.target.value)}
                    />
                  </div>
                  <div className='flex items-end'>
                    <div className='flex h-9 items-center gap-2 rounded-lg border-2 px-2'>
                      <Label htmlFor='name' className='text-foreground'>
                        {t('strictMode')}
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
                    <PlusIcon className='h-4 w-4' /> {t('addStep')}
                  </Button>
                </div>
              </div>
              <Reorder.Group axis='y' values={funnelSteps} onReorder={setFunnelSteps} className='space-y-2'>
                {funnelSteps.map((step, index) => (
                  <Reorder.Item
                    key={step.id}
                    value={step}
                    className='dark:border-border border-foreground/30 relative flex cursor-move items-center rounded-md border pl-4'
                  >
                    <div className='dark:border-border border-foreground/30 bg-card absolute -left-3 flex size-4 items-center justify-center rounded-full border p-3 shadow'>
                      <p className='text-muted-foreground text-sm font-medium'>{index + 1}</p>
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
              <div className='text-muted-foreground flex flex-1 items-center justify-center'>
                <p>{tPreview('defineAtLeastTwoSteps')}</p>
              </div>
            )}
            {searchableFunnelSteps.length >= 2 &&
              (!isPreviewLoading && funnelPreview ? (
                <div className='space-y-4 rounded-lg p-4 shadow'>
                  <Label htmlFor='name' className='text-foreground mb-2 block'>
                    {t('livePreview')}
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
          <DisabledTooltip
            disabled={!isCreateValid}
            message={t.rich('createDisabledHint', { br: () => <br className='block' /> })}
          >
            {(isDisabled) => (
              <Button
                variant='default'
                className='w-30 cursor-pointer'
                onClick={handleCreateFunnel}
                disabled={isDisabled}
              >
                {t('create')}
              </Button>
            )}
          </DisabledTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
