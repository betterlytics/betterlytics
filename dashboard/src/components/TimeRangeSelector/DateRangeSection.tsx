'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DateRangePicker } from './DateRangePicker';

interface DateRangeSectionProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onDateRangeSelect: (from: Date | undefined, to: Date | undefined) => void;
  showSameLengthHint?: boolean;
}

export function DateRangeSection({
  startDate,
  endDate,
  onDateRangeSelect,
  showSameLengthHint = false,
}: DateRangeSectionProps) {
  return (
    <div className='m-0 grid gap-4'>
      <DateRangePicker
        onDateRangeSelect={(range) => {
          onDateRangeSelect(range?.from, range?.to);
        }}
        range={{
          from: startDate,
          to: endDate,
        }}
        showSameLengthHint={showSameLengthHint}
      />
    </div>
  );
}
