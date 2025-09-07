'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DateRangePicker } from './DateRangePicker';

interface DateRangeSectionProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateSelect: (date: Date | undefined) => void;
  onEndDateSelect: (date: Date | undefined) => void;
}

export function DateRangeSection({
  startDate,
  endDate,
  onStartDateSelect,
  onEndDateSelect,
}: DateRangeSectionProps) {
  const t = useTranslations('components.timeRange');
  return (
    <div>
      <h3 className='text-text mb-2 text-sm font-medium'>{t('currentPeriod')}</h3>
      <div className='grid gap-4'>
        <DateRangePicker
          onDateRangeSelect={(range) => {
            if (range?.from !== startDate) {
              onStartDateSelect(range?.from);
            }
            if (range?.to !== endDate) {
              onEndDateSelect(range?.to);
            }
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
