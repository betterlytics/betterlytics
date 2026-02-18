'use client';

import { EVENT_RANGES, EventRange } from '@/lib/billing/plans';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('pricingSlider');

  const isUnlimited = currentRange.value > 10_000_000;

  return (
    <div className={className}>
      <div className='mb-4 flex h-16 flex-col items-center justify-end'>
        <div className='text-muted-foreground mb-2 text-sm'>{t('monthlyEvents')}</div>
        <NumberFlow
          className='text-3xl font-bold tabular-nums'
          value={currentRange.value}
          locales={'en-US'}
          format={{ notation: 'compact' }}
          suffix={isUnlimited ? '+' : undefined}
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

        <div className='relative mt-3 h-4 w-full'>
          {EVENT_RANGES.map((range, index) => (
            <span
              key={range.label}
              className={cn(
                'absolute -translate-x-1/2 text-xs transition-colors',
                range.label === currentRange.label ? 'text-primary font-semibold' : 'text-muted-foreground',
              )}
              style={{ left: `calc(0.5rem + (100% - 1rem) * ${index / (EVENT_RANGES.length - 1)})` }}
            >
              {range.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
