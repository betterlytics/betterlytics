import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Minus } from 'lucide-react';

type TableTrendIndicatorProps = {
  current: number;
  compare?: number;
  percentage?: number;
  formatter?: (value: number) => string;
};

export function TableTrendIndicator({
  current,
  compare,
  percentage,
  formatter = (val) => val.toLocaleString(),
}: TableTrendIndicatorProps) {
  if (percentage === undefined) {
    return null;
  }

  const comparedData = compare || 0;

  const difference = current - comparedData;

  if (difference === 0 && current !== 0) {
    return (
      <div className='flex items-center gap-1 text-xs'>
        <span className='text-muted-foreground'>vs {formatter(comparedData)}</span>
        <Minus className='h-3 w-3' />
        <span>0%</span>
      </div>
    );
  }

  const isPositive = current - comparedData > 0;
  const color = isPositive ? 'text-trend-up' : 'text-trend-down';
  const Icon = isPositive ? ChevronUp : ChevronDown;
  const sign = isPositive ? '+' : '-';

  return (
    <div className={cn('flex items-center gap-1 text-xs', color)}>
      <span className='text-muted-foreground'>vs {formatter(comparedData)}</span>
      {comparedData !== 0 && (
        <>
          <Icon className='h-3 w-3' fill={'currentColor'} />
          <span>
            {sign}
            {Math.abs(percentage).toFixed(1)}%
          </span>
        </>
      )}
    </div>
  );
}
