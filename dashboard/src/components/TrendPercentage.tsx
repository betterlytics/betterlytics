import React from 'react';
import { cn } from '@/lib/utils';
import { formatPercentage } from '@/utils/formatters';
import { TrendIndicator } from './TrendIndicator';
import type { SupportedLanguages } from '@/constants/i18n';

type TrendPercentageProps = {
  percentage?: number | null;
  withIcon?: boolean;
  withParenthesis?: boolean;
  noChangeText?: string;
  locale: SupportedLanguages;
};

const TrendPercentage = React.memo(
  ({ percentage, withIcon, withParenthesis, noChangeText, locale }: TrendPercentageProps) => {
    if (percentage === undefined || percentage === null) {
      return null;
    }

    if (percentage === 0) {
      return noChangeText ? <span className='text-muted-foreground/70'>({noChangeText})</span> : <span>-</span>;
    }

    const isPositive = percentage > 0;
    const sign = withIcon ? <TrendIndicator percentage={percentage} /> : isPositive ? '+' : '-';
    const color = isPositive ? 'text-trend-up' : 'text-trend-down';

    const absValue = Math.abs(percentage);
    const formatted = formatPercentage(absValue, locale);

    return (
      <span className={cn('inline-flex items-center gap-0', color)}>
        {withParenthesis && '('}
        {sign}
        {formatted}
        {withParenthesis && ')'}
      </span>
    );
  },
);

TrendPercentage.displayName = 'TrendPercentage';

export { TrendPercentage };
