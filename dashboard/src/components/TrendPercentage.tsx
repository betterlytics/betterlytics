import React from 'react';
import { cn } from '@/lib/utils';

type TrendPercentageProps = {
  percentage?: number;
  withParenthesis?: boolean;
};

const TrendPercentage = React.memo(({ percentage, withParenthesis }: TrendPercentageProps) => {
  if (percentage === undefined) {
    return null;
  }

  if (percentage === 0) {
    return <span>-</span>;
  }

  const isPositive = percentage > 0;
  const sign = isPositive ? '+' : '-';
  const color = isPositive ? 'text-green-400' : 'text-red-400';

  const absValue = Math.abs(percentage);
  const formatted = absValue % 1 ? absValue.toFixed(1) : absValue.toFixed(0);

  return (
    <span className={cn(color)}>
      {withParenthesis && '('}
      {sign}
      {formatted}%{withParenthesis && ')'}
    </span>
  );
});

TrendPercentage.displayName = 'TrendPercentage';

export { TrendPercentage };
