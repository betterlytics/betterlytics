'use client';

import { use, useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { analyzeFunnel } from '../analytics';
import { fetchFunnelDetailsAction } from '@/app/actions';

type FunnelStepsSectionProps = {
  funnelPromise: ReturnType<typeof fetchFunnelDetailsAction>;
};

export default function FunnelStepsSection({ funnelPromise }: FunnelStepsSectionProps) {
  const funnel = use(funnelPromise);
  const funnelData = useMemo(() => analyzeFunnel(funnel), [funnel]);

  return (
    <div className='text-sm font-semibold'>
      <div className='mb-3 flex items-center gap-3'>
        <h1 className='text-xl font-semibold'>{funnel.name}</h1>
        <Badge className='text-muted-foreground mt-0.5 h-[1.5rem] rounded-full' variant='outline'>
          {funnelData.steps.length} steps
        </Badge>
      </div>
      {funnelData.steps.map((step, index) => (
        <div key={step.filter}>
          <div className='flex items-end justify-between'>
            <div className='flex items-center gap-3'>
              <p className='bg-muted flex size-6 items-center justify-center rounded-full border text-xs font-medium'>
                {index + 1}
              </p>
              <p>{step.filter}</p>
            </div>
            <p className='mt-3'>{step.visitors} users</p>
          </div>
          <div className='p-3 text-gray-600'>
            <Progress className='h-4' value={100 * step.visitorsRatio} color='var(--primary)' />
            <div className='flex items-end justify-between'>
              <p>{step.visitors} users</p>
              <p className='text-right'>{Math.floor(100 * step.visitorsRatio)}%</p>
            </div>
            <Progress className='mt-2' value={100 * step.dropoffRatio} color='var(--destructive)' />
            <div className='flex items-end justify-between'>
              <p>{step.dropoffCount} users dropped-off</p>
              <p className='text-right'>{Math.floor(100 * step.dropoffRatio)}%</p>
            </div>
          </div>
          <hr />
        </div>
      ))}
    </div>
  );
}
