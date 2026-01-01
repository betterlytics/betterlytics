'use client';

import { EVENT_RANGES, EventRange } from '@/lib/billing/plans';
import { useTranslations } from 'next-intl';
import { AnimatedNumber } from '@/components/animations';

interface PricingSliderProps {
  currentRange: EventRange;
  selectedRangeIndex: number;
  handleSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

function getDisplayNumber(value: number): number {
  if (value >= 1_000_000) return Math.floor(value / 1_000_000);
  if (value >= 1_000) return Math.floor(value / 1_000);
  return value;
}

function getSuffix(value: number): string {
  if (value >= 1_000_000) return 'M';
  if (value >= 1_000) return 'K';
  return '';
}

export function PricingSlider({
  currentRange,
  selectedRangeIndex,
  handleSliderChange,
  className = '',
}: PricingSliderProps) {
  const t = useTranslations('pricingSlider');
  
  const isUnlimited = currentRange.value > 10_000_000;
  const displayNumber = getDisplayNumber(currentRange.value);
  const suffix = getSuffix(currentRange.value);
  
  return (
    <div className={className}>
      <div className='mb-4 text-center'>
        <div className='text-muted-foreground mb-2 text-sm'>{t('monthlyEvents')}</div>
        <div className='text-3xl font-bold inline-flex items-center gap-0.5'>
          <AnimatedNumber value={displayNumber} />
          {suffix}
          {isUnlimited && '+'}
        </div>
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
