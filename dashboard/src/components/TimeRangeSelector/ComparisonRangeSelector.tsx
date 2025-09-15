'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { DateRangePicker } from './DateRangePicker';

export function ComparisonRangeSelector() {
  const t = useTranslations('components.timeRange');
  const { compareEnabled, setCompareEnabled, compareStartDate, compareEndDate, setCompareDateRange } =
    useTimeRangeContext();

  return (
    <div className='w-full sm:w-auto'>
      <div className='flex flex-col gap-2'>
        <DateRangePicker
          onDateRangeSelect={(range) => {
            if (range?.from && range?.to) {
              if (!compareEnabled) setCompareEnabled(true);
              setCompareDateRange(range.from, range.to);
            }
          }}
          range={{ from: compareStartDate, to: compareEndDate }}
        />
      </div>
    </div>
  );
}

export default ComparisonRangeSelector;
