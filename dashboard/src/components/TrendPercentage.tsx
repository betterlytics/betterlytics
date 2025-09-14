import React from 'react';
import { cn } from '@/lib/utils';
import { formatPercentage } from '@/utils/formatters';
import { TrendIndicator } from './TrendIndicator';

type TrendPercentageProps = {
  percentage?: number | null;
  withIcon?: boolean;
  withParenthesis?: boolean;
};

const TrendPercentage = React.memo(({ percentage, withIcon, withParenthesis }: TrendPercentageProps) => {
  if (percentage === undefined || percentage === null) {
    return null;
  }

  if (percentage === 0) {
    return <span>-</span>;
  }

  const isPositive = percentage > 0;
  const sign = withIcon ? <TrendIndicator percentage={percentage} /> : isPositive ? '+' : '-';
  const color = isPositive ? 'text-trend-up' : 'text-trend-down';

  const absValue = Math.abs(percentage);
  const formatted = formatPercentage(absValue);

  return (
    <span className={cn('inline-flex items-center gap-0', color)}>
      {withParenthesis && '('}
      {sign}
      {formatted}
      {withParenthesis && ')'}
    </span>
  );
});

TrendPercentage.displayName = 'TrendPercentage';

export { TrendPercentage };
