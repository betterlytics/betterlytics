'use client';

import { useCallback, useRef } from 'react';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import type { useFunnelDialog } from '@/hooks/use-funnel-dialog';
import { useQueryState } from '@/hooks/use-query-state';
import { cn } from '@/lib/utils';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { FunnelStepAccordion } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/funnels/FunnelStepAccordion';

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
  const t = useTranslations('components.funnels.preview');
  const isNameEmpty = metadata.name.trim() === '';
  const showNameError = hasAttemptedSubmit && isNameEmpty;

  const stepsListRef = useRef<HTMLDivElement>(null);
  const handleAddStep = useCallback(() => {
    addEmptyFunnelStep();
    requestAnimationFrame(() => {
      stepsListRef.current?.lastElementChild
        ?.querySelector<HTMLElement>('[data-focus-target]')
        ?.focus({ focusVisible: true } as FocusOptions);
    });
  }, [addEmptyFunnelStep]);

  const { input, options } = useBAQueryParams();
  const { isDemo } = useDashboardAuth();
  const gpQuery = trpc.filters.getGlobalPropertyKeys.useQuery(input, { ...options, enabled: !isDemo });
  const { data, loading } = useQueryState(gpQuery, !isDemo);
  const globalPropertyKeys = isDemo || loading ? undefined : (data ?? []);

  return (
    <div 
      className='flex min-h-0 flex-1 flex-col p-2 gap-1 sm:gap-2 sm:p-5 bg-card border-border border-1 rounded-lg'
      style={{
        '--min-funnel-pt': '260px',
        '--funnel-row-h': 'min(550px, calc(100dvh - var(--min-funnel-pt)))',
      } as React.CSSProperties}
    >
      <div className='grid grid-cols-24 lg:gap-6 mb-1'>
        <div className='col-span-24 lg:col-span-13 lg:pl-11 flex flex-wrap items-end gap-2 sm:gap-4'>
          <div className='w-full sm:w-auto sm:max-w-md sm:min-w-40'>
            <Label htmlFor='name' className='text-foreground mb-1 block'>
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
          <div className='flex h-9 items-center gap-2 rounded-lg px-2'>
            <Label htmlFor='strict-mode' className='text-foreground cursor-pointer'>
              {labels.strictMode}
            </Label>
            <Switch
              id='strict-mode'
              className='cursor-pointer'
              checked={metadata.isStrict}
              onCheckedChange={setIsStrict}
            />
          </div>
          <Button
            variant='outline'
            onClick={handleAddStep}
            className='ml-auto cursor-pointer whitespace-nowrap'
          >
            <PlusIcon className='size-4' /> {labels.addStep}
          </Button>
        </div>
        <div className='hidden lg:flex lg:col-span-11 items-end'>
          <h2 className='text-foreground text-base font-semibold'>{t('title')}</h2>
        </div>
      </div>

      <div
        className='grid min-h-0 flex-1 grid-cols-24 overflow-hidden lg:gap-6 lg:grid-rows-[minmax(0,var(--funnel-row-h))]'
      >
        <FunnelStepAccordion
          listRef={stepsListRef}
          className='col-span-24 min-h-0 min-w-0 lg:col-span-13'
          steps={funnelSteps}
          initialOpenId={initialOpenId}
          onReorder={setFunnelSteps}
          onUpdateStep={updateFunnelStep}
          onRemoveStep={removeFunnelStep}
          globalPropertyKeys={globalPropertyKeys}
          hasAttemptedSubmit={hasAttemptedSubmit}
        />
        <FunnelBarplot
          className='hidden max-h-[min(420px,var(--funnel-row-h))] pt-3 lg:flex lg:col-span-11 min-h-[min(24rem,var(--funnel-row-h))]'
          funnel={funnelPreview}
          emptySteps={emptySteps}
          status={previewStatus}
          refetching={previewRefetching}
          emptyMessage={t('defineAtLeastTwoSteps')}
          fill
        />
      </div>
    </div>
  );
}
