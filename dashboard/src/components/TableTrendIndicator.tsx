import { Minus } from 'lucide-react';
import { TrendPercentage } from './TrendPercentage';
import { useLocale } from 'next-intl';
import type { SupportedLanguages } from '@/constants/i18n';

type TableTrendIndicatorProps = {
  current: number;
  compare?: number;
  percentage?: number;
  formatter?: (value: number, locale?: SupportedLanguages) => string;
  allowNullish?: boolean;
};

export function TableTrendIndicator({
  current,
  compare,
  percentage,
  formatter: formatterProp,
  allowNullish,
}: TableTrendIndicatorProps) {
  const locale = useLocale();
  const formatter = (val: number) => formatterProp ? formatterProp(val, locale) : val.toLocaleString(locale);

  if (percentage === undefined) {
    return null;
  }

  if (compare == null && allowNullish) {
    return (
      <div className='flex items-center gap-1 text-xs opacity-85'>
        <span className='text-muted-foreground'>vs </span>
        <Minus className='h-3 w-3' />
      </div>
    );
  }

  const comparedData = compare ?? 0;

  const difference = current - comparedData;

  if (difference === 0 && current !== 0) {
    return (
      <div className='flex items-center gap-1 text-xs opacity-85'>
        <span className='text-muted-foreground'>vs {formatter(comparedData)}</span>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-1 text-xs'>
      <span className='text-foreground opacity-75'>vs {formatter(comparedData)}</span>
      {comparedData !== 0 && <TrendPercentage percentage={percentage} withIcon locale={locale} />}
    </div>
  );
}
