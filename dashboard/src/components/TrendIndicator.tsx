import React from 'react';
import { cn } from '@/lib/utils';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

type TrendIndicatorProps = {
  percentage?: number;
};

const TrendIndicator = React.memo(({ percentage }: TrendIndicatorProps) => {
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
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const color = isPositive ? 'text-green-400' : 'text-red-400';

  return (
    <div className='flex items-center'>
      <Icon className={cn('h-3 w-3', color)} />
    </div>
  );
});

TrendIndicator.displayName = 'TrendIndicator';

export { TrendIndicator };
