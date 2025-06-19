import { analyzeFunnel } from '@/lib/analytics';
import type { FunnelDetails, FunnelPreview } from '@/entities/funnels';
import { useMemo } from 'react';
import { formatPercentage } from '@/utils/formatters';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

type BAFunnelProps = {
  funnel: FunnelDetails | FunnelPreview;
};

export function BAFunnel({ funnel }: BAFunnelProps) {
  const funnelData = useMemo(() => {
    return analyzeFunnel(funnel);
  }, [funnel]);

  return (
    <div className='text-sm font-semibold'>
      <div className='mb-3 flex items-center gap-3'>
        <h1 className='text-xl font-semibold'>{'name' in funnel ? funnel.name : 'Funnel'}</h1>
        <Badge className='text-muted-foreground mt-0.5 h-[1.5rem] rounded-full' variant='outline'>
          {funnelData.steps.length} steps
        </Badge>
      </div>
      {funnelData.steps.map((step, index) => (
        <div key={step.filter + index} className='mb-2 last:mb-0'>
          <div className='flex items-end justify-between'>
            <div className='flex items-center gap-3'>
              <p className='bg-muted flex size-6 items-center justify-center rounded-full border text-xs font-medium'>
                {index + 1}
              </p>
              <p className='truncate' title={step.filter}>
                {step.filter}
              </p>
            </div>
            <p className='text-muted-foreground mb-1 text-xs whitespace-nowrap'>
              {step.visitors} users ( {formatPercentage(Math.floor(100 * step.visitorsRatio), 0)} )
            </p>
          </div>
          <div className='text-muted-foreground pr-1 pl-9 text-xs'>
            <Progress className='h-3' value={100 * step.visitorsRatio} color='var(--primary)' />
            {index < funnelData.steps.length - 1 && (
              <>
                <Progress className='mt-1 h-2' value={100 * step.dropoffRatio} color='var(--destructive)' />
                <div className='mt-0.5 flex w-full items-end justify-end'>
                  <p className='text-muted-foreground text-xs whitespace-nowrap'>
                    {step.dropoffCount} dropped ( {formatPercentage(Math.floor(100 * step.dropoffRatio), 0)} )
                  </p>
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
