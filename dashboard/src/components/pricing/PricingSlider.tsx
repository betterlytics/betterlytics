'use client';

import { EVENT_RANGES, EventRange } from '@/lib/billing/plans';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatters';
import { useLocale, useTranslations } from 'next-intl';
import NumberFlow from '@number-flow/react';

interface PricingSliderProps {
  currentRange: EventRange;
  selectedRangeIndex: number;
  handleSliderChange: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
}

export function PricingSlider({
  currentRange,
  selectedRangeIndex,
  handleSliderChange,
  className = '',
}: PricingSliderProps) {
  const locale = useLocale();
  const t = useTranslations('pricingSlider');

  return (
    <div className={className}>
      <div className='mb-4 text-center'>
        <div className='text-muted-foreground mb-2 text-sm'>{t('monthlyEvents')}</div>
        <NumberFlow
          className='text-3xl font-bold tabular-nums'
          value={currentRange.value}
          locales={locale}
          format={{ notation: 'compact' }}
          suffix={currentRange.value > 10_000_000 ? '+' : undefined}
          willChange
        />
      </div>

      <div className='relative'>
        <input
          type='range'
          value={selectedRangeIndex}
          onChange={handleSliderChange}
          max={EVENT_RANGES.length - 1}
          min={0}
          step={1}
          className='slider h-3 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700'
        />

        <div className='mt-3 flex justify-between'>
          {EVENT_RANGES.map((range) => (
            <div
              key={range.value}
              className={cn(
                'text-xs transition-colors',
                range.value === currentRange.value ? 'text-primary font-semibold' : 'text-muted-foreground',
              )}
            >
              {range.value > 10_000_000
                ? `${formatNumber(10_000_000, locale, { maximumFractionDigits: 0 })}+`
                : formatNumber(range.value, locale, { maximumFractionDigits: 0 })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
