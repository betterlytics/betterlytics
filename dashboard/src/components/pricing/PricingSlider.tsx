'use client';

import { useState } from 'react';
import { EVENT_RANGES, EventRange } from '@/lib/billing/plans';
import { useTranslations } from 'next-intl';
import { AnimatedNumber } from '@/components/AnimatedNumber';

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
  
  // Test sliders
  const [intValue, setIntValue] = useState(1);
  const [decimalValue, setDecimalValue] = useState(1.0);
  
  // Handle special "10M+" case
  const isUnlimited = currentRange.value > 10_000_000;
  const displayNumber = getDisplayNumber(currentRange.value);
  const suffix = getSuffix(currentRange.value);
  
  return (
    <div className={className}>
      {/* TEST SLIDER 1: Integers 1-100 */}
      <div className='mb-8 p-4 border border-dashed border-yellow-500 rounded-lg'>
        <div className='text-yellow-600 text-xs mb-2'>TEST: Integer Slider (1-100)</div>
        <div className='text-2xl font-bold mb-2'>
          <AnimatedNumber value={intValue} />
        </div>
        <input
          type='range'
          value={intValue}
          onChange={(e) => setIntValue(Number(e.target.value))}
          min={1}
          max={100}
          step={1}
          className='w-full'
        />
      </div>

      {/* TEST SLIDER 2: Decimals 0.0-100.0 */}
      <div className='mb-8 p-4 border border-dashed border-blue-500 rounded-lg'>
        <div className='text-blue-600 text-xs mb-2'>TEST: Decimal Slider (0.0-100.0)</div>
        <div className='text-2xl font-bold mb-2'>
          <AnimatedNumber value={Math.floor(decimalValue)} />
          <span className='text-muted-foreground'>.</span>
          <AnimatedNumber value={Math.round((decimalValue % 1) * 10)} />
        </div>
        <input
          type='range'
          value={decimalValue}
          onChange={(e) => setDecimalValue(Number(e.target.value))}
          min={0}
          max={100}
          step={0.1}
          className='w-full'
        />
      </div>

      {/* ORIGINAL PRICING SLIDER */}
      <div className='mb-4 text-center'>
        <div className='text-muted-foreground mb-2 text-sm'>{t('monthlyEvents')}</div>
        <div className='text-3xl font-bold inline-flex items-center gap-0.5'>
          <span className='text-muted-foreground'>LABEL: </span>
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


