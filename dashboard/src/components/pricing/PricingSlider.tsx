'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import { EVENT_RANGES, EventRange } from '@/lib/billing/plans';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatters';
import { useLocale, useTranslations } from 'next-intl';
import NumberFlow from '@number-flow/react';

interface PricingSliderProps {
  currentRange: EventRange;
  selectedRangeIndex: number;
  onSelectIndex: (index: number) => void;
  className?: string;
}

export function PricingSlider({
  currentRange,
  selectedRangeIndex,
  onSelectIndex,
  className = '',
}: PricingSliderProps) {
  const t = useTranslations('pricingSlider');
  const locale = useLocale();

  const isUnlimited = currentRange.value > 10_000_000;
  const lastIndex = EVENT_RANGES.length - 1;

  return (
    <div className={className}>
      <div className='mb-3 flex items-baseline justify-center gap-2'>
        <NumberFlow
          className='text-2xl font-semibold tabular-nums'
          value={currentRange.value}
          locales={locale}
          format={{ notation: 'compact' }}
          suffix={isUnlimited ? '+' : undefined}
          willChange
        />
        <span className='text-muted-foreground text-sm'>{t('monthlyEvents')}</span>
      </div>

      <SliderPrimitive.Root
        value={[selectedRangeIndex]}
        onValueChange={([v]) => onSelectIndex(v)}
        min={0}
        max={lastIndex}
        step={1}
        className='relative flex h-5 w-full cursor-pointer touch-none items-center select-none'
      >
        <SliderPrimitive.Track className='bg-muted relative h-2 w-full grow overflow-hidden rounded-full'>
          <SliderPrimitive.Range className='bg-primary absolute h-full' />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className='border-background bg-primary block h-5 w-5 cursor-pointer rounded-full border-[3px] shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_25%,transparent),0_2px_6px_rgba(0,0,0,0.15)] transition-[transform,box-shadow] duration-150 ease-out hover:scale-110 focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_30%,transparent),0_2px_6px_rgba(0,0,0,0.15)] focus-visible:outline-none active:scale-105' />
      </SliderPrimitive.Root>

      <div className='relative mt-3 h-4 w-full'>
        {EVENT_RANGES.map((range, index) => {
          const isActive = range.value === currentRange.value;
          const label =
            range.value > 10_000_000
              ? `${formatNumber(10_000_000, locale, { maximumFractionDigits: 0 })}+`
              : formatNumber(range.value, locale, { maximumFractionDigits: 0 });
          return (
            <button
              key={range.value}
              type='button'
              onClick={() => onSelectIndex(index)}
              className={cn(
                'absolute -translate-x-1/2 cursor-pointer rounded text-xs transition-colors',
                isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground',
              )}
              style={{ left: `calc(0.625rem + (100% - 1.25rem) * ${index / lastIndex})` }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
