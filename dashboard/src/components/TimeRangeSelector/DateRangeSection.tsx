'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DateRangePicker } from './DateRangePicker';

interface DateRangeSectionProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onDateRangeSelect: (from: Date | undefined, to: Date | undefined) => void;
}

export function DateRangeSection({ startDate, endDate, onDateRangeSelect }: DateRangeSectionProps) {
  return (
    <div>
      <div className='grid gap-4'>
        <DateRangePicker
          onDateRangeSelect={(range) => {
            onDateRangeSelect(range?.from, range?.to);
          }}
          range={{
            from: startDate,
            to: endDate,
          }}
        />
      </div>
    </div>
  );
}
