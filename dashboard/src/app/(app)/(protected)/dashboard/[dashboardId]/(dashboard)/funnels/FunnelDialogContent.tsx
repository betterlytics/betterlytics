'use client';

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';

import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { InfoTooltip } from '@/components/ui-extended/InfoTooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { useFunnelDialog } from '@/hooks/use-funnel-dialog';
import { cn } from '@/lib/utils';
import { usePropertyKeys } from '@/hooks/use-property-keys';
import { FunnelStepAccordion } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/funnels/FunnelStepAccordion';

type FunnelDialogContentProps = {
  dialog: ReturnType<typeof useFunnelDialog>;
  hasAttemptedSubmit: boolean;
  initialOpenId: string | undefined;
  labels: {
    name: string;
    namePlaceholder?: string;
    strictMode: string;
    addStep: string;
  };
};

export function FunnelDialogContent({
  dialog,
  hasAttemptedSubmit,
  initialOpenId,
  labels,
}: FunnelDialogContentProps) {
  const {
    metadata,
    setName,
    setIsStrict,
    funnelSteps,
    addEmptyFunnelStep,
    setFunnelSteps,
    updateFunnelStep,
    removeFunnelStep,
    funnelPreview,
    emptySteps,
    previewStatus,
    previewRefetching,
  } = dialog;
  const t = useTranslations('components.funnels');
  const isNameEmpty = metadata.name.trim() === '';
  const showNameError = hasAttemptedSubmit && isNameEmpty;

  const stepsListRef = useRef<HTMLDivElement>(null);
  const handleAddStep = useCallback(() => {
    addEmptyFunnelStep();
    requestAnimationFrame(() => {
      stepsListRef.current?.lastElementChild
        ?.querySelector<HTMLElement>('[data-focus-target]')
        ?.focus({ preventScroll: true });
    });
  }, [addEmptyFunnelStep]);

  const propertyKeys = usePropertyKeys();

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-4'>
      <div className='flex shrink-0 flex-wrap items-end gap-x-6 gap-y-3'>
        <div className='w-full sm:w-auto sm:max-w-sm sm:min-w-[18rem]'>
          <Label htmlFor='name' className='text-foreground mb-1.5 block'>
            {labels.name} <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='name'
            placeholder={labels.namePlaceholder}
            value={metadata.name}
            onChange={(evt) => setName(evt.target.value)}
            className={cn(showNameError && 'border-destructive')}
          />
        </div>
        <div className='flex h-9 items-center gap-2'>
          <Label htmlFor='strict-mode' className='text-foreground cursor-pointer'>
            {labels.strictMode}
          </Label>
          <InfoTooltip side='top' iconClassName='size-3.5' ariaLabel={labels.strictMode}>
            <InfoTooltip.Description>{t('strictModeInfo')}</InfoTooltip.Description>
          </InfoTooltip>
          <Switch
            id='strict-mode'
            className='cursor-pointer'
            checked={metadata.isStrict}
            onCheckedChange={setIsStrict}
          />
        </div>
      </div>

      <Separator className='mt-2' />

      <div className='flex min-h-0 flex-1 flex-col overflow-hidden lg:h-[520px] lg:flex-initial lg:flex-row lg:gap-6'>
        <FunnelStepAccordion
          listRef={stepsListRef}
          className='min-h-0 min-w-0 flex-1 lg:flex-[0_1_36rem]'
          steps={funnelSteps}
          initialOpenId={initialOpenId}
          onReorder={setFunnelSteps}
          onUpdateStep={updateFunnelStep}
          onRemoveStep={removeFunnelStep}
          propertyKeys={propertyKeys}
          hasAttemptedSubmit={hasAttemptedSubmit}
          onAddStep={handleAddStep}
          addStepLabel={labels.addStep}
        />
        <FunnelBarplot
          className='hidden pt-3 lg:flex lg:min-w-0 lg:flex-1'
          funnel={funnelPreview}
          emptySteps={emptySteps}
          status={previewStatus}
          refetching={previewRefetching}
          emptyMessage={t('preview.defineAtLeastTwoSteps')}
          fill
        />
      </div>
    </div>
  );
}
