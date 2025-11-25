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
import { useDebounce } from '@/hooks/useDebounce';
import { ComponentProps } from 'react';
import { fetchFunnelPreviewAction } from '@/app/actions/funnels';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQuery } from '@tanstack/react-query';
import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { FunnelStepFilter } from './FunnelStepFilter';
import { useFunnelSteps } from '@/hooks/use-funnel-steps';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

type CreateFunnelDialogProps = {
  triggerText?: string;
  triggerVariant?: ComponentProps<typeof Button>['variant'];
};

export function CreateFunnelDialog({ triggerText, triggerVariant }: CreateFunnelDialogProps) {
  const { funnelSteps, addEmptyFunnelStep, updateFunnelStep, removeFunnelStep } = useFunnelSteps();
  const t = useTranslations('components.funnels.create');

  const dashboardId = useDashboardId();

  const debouncedFunnelSteps = useDebounce(funnelSteps, 500);

  console.log(funnelSteps);

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
        <Button variant={triggerVariant || 'ghost'} className='cursor-pointer'>
          <PlusIcon className='h-4 w-4' />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-background flex h-[90dvh] w-[70dvw] !max-w-[1000px] flex-col'>
        <DialogHeader>
          <DialogTitle>Create funnel</DialogTitle>
          <DialogDescription>
            Modify the funnel to your liking, preview the changes, or delete the funnel.
          </DialogDescription>
        </DialogHeader>
        <div className='scrollbar-thin bg-card flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg'>
          <div className='flex flex-1 flex-col gap-4'>
            <div className='flex min-h-72 flex-1 flex-col gap-4 rounded-lg p-4 shadow'>
              <div className='flex w-full justify-between'>
                <div className='flex w-1/2 gap-4'>
                  <div className='w-full max-w-md'>
                    <Label htmlFor='name' className='text-foreground mb-1 block'>
                      Name
                    </Label>
                    <Input id='name' placeholder='Enter funnel name' />
                  </div>
                  <div className='min-w-20'>
                    <Label htmlFor='name' className='text-foreground mb-1 block'>
                      Strict mode
                    </Label>
                    <div className='mt-3 flex justify-center'>
                      <Switch id='strict-mode' defaultChecked />
                    </div>
                  </div>
                </div>
                <div className='flex items-end'>
                  <Button
                    variant='outline'
                    onClick={addEmptyFunnelStep}
                    className='cursor-pointer whitespace-nowrap'
                  >
                    <PlusIcon className='mr-2 h-4 w-4' /> {t('addStep')}
                  </Button>
                </div>
              </div>
              <div className='space-y-2'>
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
              </div>
            </div>
            {funnelSteps.length < 2 && (
              <div className='text-muted-foreground flex h-full items-center justify-center'>
                <p>Please add at least 2 steps to preview the funnel</p>
              </div>
            )}
            {funnelSteps.length >= 2 &&
              (!isPreviewLoading && funnelPreviewData ? (
                <div className='space-y-4 rounded-lg p-4 shadow'>
                  <Label htmlFor='name' className='text-foreground mb-2 block'>
                    Preview
                  </Label>
                  <FunnelBarplot funnel={funnelPreviewData} />
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
          <Button variant='default' className='w-30 cursor-pointer'>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
