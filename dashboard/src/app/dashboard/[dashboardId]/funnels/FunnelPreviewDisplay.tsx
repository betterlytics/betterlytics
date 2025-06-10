'use client';

import { useMemo } from 'react';
import { type FunnelPreview } from '@/entities/funnels';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { analyzeFunnel } from './analytics';
import { formatPercentage } from '@/utils/formatters';

type FunnelPreviewDisplayProps = {
  funnelDetails?: FunnelPreview;
  funnelName: string;
  isLoading: boolean;
};

export function FunnelPreviewDisplay({ funnelDetails, funnelName, isLoading }: FunnelPreviewDisplayProps) {
  const funnelData = useMemo(() => {
    return funnelDetails && analyzeFunnel(funnelDetails);
  }, [funnelDetails]);

  if (isLoading) {
    return (
      <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
        <div className='border-border border-t-primary mb-2 h-8 w-8 animate-spin rounded-full border-4'></div>
        <p>Loading preview...</p>
      </div>
    );
  }

  if (!funnelData || !funnelDetails || funnelDetails.queryFilters.length < 2 || funnelName.length === 0) {
    return (
      <div className='text-muted-foreground flex h-full items-center justify-center'>
        <p>Define funnel name and at least steps to see the preview.</p>
      </div>
    );
  }

  return (
    <div className='scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 text-card-foreground h-full overflow-y-auto p-4 text-sm'>
      <div className='mb-3 flex items-center gap-3'>
        <h2 className='truncate text-lg font-semibold' title={funnelName}>
          {funnelName}
        </h2>
        <Badge className='mt-1 h-[50%] rounded-full whitespace-nowrap' variant='outline'>
          {funnelData.steps.length} steps
        </Badge>
      </div>
      {funnelData.steps.map((step, index) => (
        <div key={step.filter + index} className='mb-2 last:mb-0'>
          <div className='flex items-end justify-between'>
            <div className='flex items-center gap-3'>
              <p className='bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-full text-xs font-medium'>
                {index + 1}
              </p>
              <p className='truncate' title={step.filter}>
                {step.filter}
              </p>
            </div>
            <p className='text-muted-foreground mt-1 text-xs whitespace-nowrap'>{step.visitors} users</p>
          </div>
          <div className='text-muted-foreground pr-1 pl-9 text-xs'>
            <Progress className='h-3' value={100 * step.visitorsRatio} color='#22C55E' />
            <div className='mt-0.5 flex items-end justify-between'>
              <p>{step.visitors} users</p>
              <p className='text-right'>{formatPercentage(Math.floor(100 * step.visitorsRatio), 0)} total</p>
            </div>
            {index < funnelData.steps.length - 1 && (
              <>
                <Progress className='mt-1 h-2' value={100 * step.dropoffRatio} color='#F97315' />
                <div className='mt-0.5 flex items-end justify-between'>
                  <p>{step.dropoffCount} dropped</p>
                  <p className='text-right'>{formatPercentage(Math.floor(100 * step.dropoffRatio), 0)} drop</p>
                </div>
              </>
            )}
          </div>
          {index < funnelData.steps.length - 1 && <hr className='mt-2 mb-2 ml-9' />}
        </div>
      ))}
    </div>
  );
}
