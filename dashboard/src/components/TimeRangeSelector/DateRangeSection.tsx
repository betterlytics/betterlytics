'use client';

import React from 'react';
import { DatePicker } from './DatePicker';
import { useTranslations } from 'next-intl';

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
      <div className='grid grid-cols-2 gap-4'>
        <DatePicker
          label={t('startDate')}
          date={startDate}
          onDateSelect={(date) => date && onStartDateSelect(date)}
          disabled={(date) => date > new Date()}
          id='startDateInput'
        />
        <DatePicker
          label={t('endDate')}
          date={endDate}
          onDateSelect={(date) => date && onEndDateSelect(date)}
          disabled={(date) => {
            if (date > new Date()) return true;
            if (startDate && date < startDate) return true;
            return false;
          }}
          id='endDateInput'
        />
      </div>
    </div>
  );
}
