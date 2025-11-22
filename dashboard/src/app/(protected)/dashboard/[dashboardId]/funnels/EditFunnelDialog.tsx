'use client';

import { Pencil, PlusIcon } from 'lucide-react';
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
import { PresentedFunnel } from '@/presenters/toFunnel';
import { QueryFilterInputRow } from '@/components/filters/QueryFilterInputRow';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useTranslations } from 'next-intl';
import { useDebounce } from '@/hooks/useDebounce';
import { useMemo } from 'react';
import { fetchFunnelPreviewAction } from '@/app/actions/funnels';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQuery } from '@tanstack/react-query';
import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { FunnelStepFilter } from './FunnelStepFilter';
import { useFunnelSteps } from '@/hooks/use-funnel-steps';

type EditFunnelDialogProps = {
  funnel: PresentedFunnel;
};

export function EditFunnelDialog({ funnel }: EditFunnelDialogProps) {
  const { funnelSteps, addEmptyFunnelStep, updateFunnelStep, removeFunnelStep } = useFunnelSteps(
    funnel.steps.map((step) => step.step),
  );
  const t = useTranslations('components.funnels.create');

  const dashboardId = useDashboardId();

  const debouncedFunnelSteps = useDebounce(funnelSteps, 500);

  const { data: funnelPreviewData, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['funnelPreview', dashboardId, funnelSteps, false],
    queryFn: async () => {
      return fetchFunnelPreviewAction(dashboardId, funnelSteps, false);
    },
    enabled: debouncedFunnelSteps.length >= 2,
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='ghost' className='cursor-pointer'>
          <Pencil className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-background flex h-[90dvh] w-[70dvw] !max-w-[1000px] flex-col'>
        <DialogHeader>
          <DialogTitle>Edit funnel</DialogTitle>
          <DialogDescription>
            Modify the funnel to your liking, preview the changes, or delete the funnel.
          </DialogDescription>
        </DialogHeader>
        <div className='flex min-h-0 flex-1 flex-col gap-4'>
          <div className='bg-card scrollbar-thin flex min-h-72 flex-1 flex-col overflow-y-auto rounded-lg p-4 shadow'>
            <div className='scrollbar-thin space-y-2'>
              {funnelSteps.map((step, i) => (
                <div key={step.id + i} className='relative flex items-center rounded-md border pl-4'>
                  <div className='bg-card absolute -left-3 flex size-4 items-center justify-center rounded-full border p-3 shadow'>
                    <p className='text-muted-foreground text-sm font-medium'>{i + 1}</p>
                  </div>
                  <FunnelStepFilter
                    key={step.id + i}
                    onFilterUpdate={updateFunnelStep}
                    filter={step}
                    requestRemoval={(_step) => removeFunnelStep(_step.id)}
                  />
                </div>
              ))}
              <div className='mt-1 ml-8 px-1'>
                <Button
                  variant='outline'
                  onClick={addEmptyFunnelStep}
                  className='cursor-pointer whitespace-nowrap'
                >
                  <PlusIcon className='mr-2 h-4 w-4' /> {t('addStep')}
                </Button>
              </div>
            </div>
          </div>
          {!isPreviewLoading && funnelPreviewData ? (
            <div className='bg-card space-y-2 rounded-lg p-4 shadow'>
              <div className='text-lg font-semibold'>Preview</div>
              <FunnelBarplot funnel={funnelPreviewData} />
            </div>
          ) : (
            <section className='space-y-3'>
              <div className='bg-muted h-6 w-48 animate-pulse rounded' />
              <div className='bg-muted h-40 w-full animate-pulse rounded' />
            </section>
          )}
        </div>
        <DialogFooter className='flex flex-1 items-end justify-end gap-2'>
          <Button variant='outline' className='w-30 cursor-pointer'>
            Cancel
          </Button>
          <Button variant='default' className='w-30 cursor-pointer'>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
