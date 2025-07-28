import { cn } from '@/lib/utils';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

type TrendIndicatorProps = {
  percentage?: number;
};

export function TrendIndicator({ percentage }: TrendIndicatorProps) {
  if (percentage === undefined) {
    return null;
  }

  if (percentage === 0) {
    return (
      <div className='flex items-center gap-1'>
        <Minus className='h-3 w-3' />
        <span>0%</span>
      </div>
    );
  }

  const isPositive = percentage > 0;
  const color = isPositive ? 'text-green-400' : 'text-red-400';
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const sign = isPositive ? '+' : '-';

  return (
    <div className={cn('flex items-center gap-1', color)}>
      <Icon className='h-3 w-3' />
      <span>
        {sign}
        {Math.abs(percentage).toFixed(1)}%
      </span>
    </div>
  );
}
