'use client';

import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { useQueryState } from '@/hooks/use-query-state';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { cn } from '@/lib/utils';
import type { useFunnelDialog } from '@/hooks/use-funnel-dialog';

import { FunnelStepAccordion } from './FunnelStepAccordion';

type FunnelDialogContentProps = {
  metadata: ReturnType<typeof useFunnelDialog>['metadata'];
  setName: ReturnType<typeof useFunnelDialog>['setName'];
  setIsStrict: ReturnType<typeof useFunnelDialog>['setIsStrict'];
  funnelSteps: ReturnType<typeof useFunnelDialog>['funnelSteps'];
  addEmptyFunnelStep: ReturnType<typeof useFunnelDialog>['addEmptyFunnelStep'];
  setFunnelSteps: ReturnType<typeof useFunnelDialog>['setFunnelSteps'];
  updateFunnelStep: ReturnType<typeof useFunnelDialog>['updateFunnelStep'];
  removeFunnelStep: ReturnType<typeof useFunnelDialog>['removeFunnelStep'];
  funnelPreview: ReturnType<typeof useFunnelDialog>['funnelPreview'];
  emptySteps: ReturnType<typeof useFunnelDialog>['emptySteps'];
  previewStatus: ReturnType<typeof useFunnelDialog>['previewStatus'];
  previewRefetching: ReturnType<typeof useFunnelDialog>['previewRefetching'];
  hasAttemptedSubmit: boolean;
  initialOpenIds: string[];
  labels: {
    name: string;
    namePlaceholder?: string;
    strictMode: string;
    addStep: string;
  };
};

export function FunnelDialogContent({
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
  hasAttemptedSubmit,
  initialOpenIds,
  labels,
}: FunnelDialogContentProps) {
  const t = useTranslations('components.funnels.preview');
  const isNameEmpty = metadata.name.trim() === '';
  const showNameError = hasAttemptedSubmit && isNameEmpty;

  const { input, options } = useBAQueryParams();
  const { isDemo } = useDashboardAuth();
  const gpQuery = trpc.filters.getGlobalPropertyKeys.useQuery(input, { ...options, enabled: !isDemo });
  const { data, loading } = useQueryState(gpQuery, !isDemo);
  const globalPropertyKeys = isDemo || loading ? undefined : (data ?? []);

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4'>
      <div className='flex flex-wrap items-end gap-4 pl-3'>
        <div className='max-w-md min-w-40'>
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
          onClick={addEmptyFunnelStep}
          className='ml-auto cursor-pointer whitespace-nowrap'
        >
          <PlusIcon className='size-4' /> {labels.addStep}
        </Button>
      </div>

      <div className='grid min-h-0 flex-1 grid-cols-12 gap-6 overflow-hidden'>
        <FunnelStepAccordion
          className='col-span-7 min-h-0'
          steps={funnelSteps}
          initialOpenIds={initialOpenIds}
          onReorder={setFunnelSteps}
          onUpdateStep={updateFunnelStep}
          onRemoveStep={removeFunnelStep}
          globalPropertyKeys={globalPropertyKeys}
          hasAttemptedSubmit={hasAttemptedSubmit}
        />
        <div className='sticky top-0 col-span-5 self-start'>
          <FunnelBarplot
            funnel={funnelPreview}
            emptySteps={emptySteps}
            status={previewStatus}
            refetching={previewRefetching}
            emptyMessage={t('defineAtLeastTwoSteps')}
          />
        </div>
      </div>
    </div>
  );
}
