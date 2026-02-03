'use client';

import { EVENT_RANGES, EventRange } from '@/lib/billing/plans';
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

  return (
    <div className={className}>
      <div className='mb-4 text-center'>
        <div className='text-muted-foreground mb-2 text-sm'>{t('monthlyEvents')}</div>
        <NumberFlow
          className='text-3xl font-bold'
          value={currentRange.value}
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
              key={range.label}
              className={`text-xs transition-colors ${
                range.label === currentRange.label ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              {range.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
