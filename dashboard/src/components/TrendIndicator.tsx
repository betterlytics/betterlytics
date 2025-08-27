import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Minus } from 'lucide-react';

type TrendIndicatorProps = {
  percentage?: number;
};

const TrendIndicator = React.memo(({ percentage }: TrendIndicatorProps) => {
  if (percentage === undefined) {
    return null;
  }

  if (percentage === 0) {
    return (
      <div className='flex items-center'>
        <Minus className='h-3 w-3' />
      </div>
    );
  }

  const isPositive = percentage > 0;
  const Icon = isPositive ? ChevronUp : ChevronDown;
  const color = isPositive ? 'text-green-400' : 'text-red-400';

  return (
    <div className='flex items-center'>
      <Icon className={cn('h-3 w-3', color)} fill='currentColor' />
    </div>
  );
});

TrendIndicator.displayName = 'TrendIndicator';

export { TrendIndicator };
