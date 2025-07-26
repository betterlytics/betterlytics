import { cn } from '@/lib/utils';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

type TableTrendIndicatorProps = {
  current: number;
  compare?: number;
  percentage?: number;
};

export function TableTrendIndicator({ current, compare, percentage }: TableTrendIndicatorProps) {
  if (percentage === undefined) {
    return null;
  }

  const comparedData = compare || 0;

  const difference = current - comparedData;

  if (difference === 0) {
    return (
      <div className='flex items-center gap-1 text-xs'>
        <span className='text-muted-foreground'>vs {comparedData}</span>
        <Minus className='h-3 w-3' />
        <span>0%</span>
      </div>
    );
  }

  const isPositive = current - comparedData > 0;
  const color = isPositive ? 'text-green-400' : 'text-red-400';
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const sign = isPositive ? '+' : '';

  return (
    <div className={cn('flex items-center gap-1 text-xs', color)}>
      <span className='text-muted-foreground'>vs {comparedData}</span>
      <Icon className='h-3 w-3' />
      {comparedData !== 0 && (
        <span>
          {sign}
          {Math.abs(percentage).toFixed(1)}%
        </span>
      )}
    </div>
  );
}
