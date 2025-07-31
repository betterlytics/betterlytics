import React from 'react';
import { cn } from '@/lib/utils';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

type TrendPercentageProps = {
  percentage?: number;
};

const TrendPercentage = React.memo(({ percentage }: TrendPercentageProps) => {
  if (percentage === undefined) {
    return null;
  }

  if (percentage === 0) {
    return <span>-</span>;
  }

  const isPositive = percentage > 0;
  const sign = isPositive ? '+' : '-';
  const color = isPositive ? 'text-green-400' : 'text-red-400';

  return (
    <span className={cn(color)}>
      {sign}
      {Math.abs(percentage).toFixed(1)}%
    </span>
  );
});

TrendPercentage.displayName = 'TrendPercentage';

export { TrendPercentage };
