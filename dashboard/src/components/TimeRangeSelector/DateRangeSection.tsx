'use client';

import React from 'react';
import { DatePicker } from './DatePicker';

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
  return (
    <div>
      <h3 className='mb-2 text-sm font-medium text-gray-500'>Current period</h3>
      <div className='grid grid-cols-2 gap-4'>
        <DatePicker
          label='Start date'
          date={startDate}
          onDateSelect={(date) => onStartDateSelect(date)}
          disabled={(date) => date > new Date()}
          id='startDateInput'
        />
        <DatePicker
          label='End date'
          date={endDate}
          onDateSelect={(date) => onEndDateSelect(date)}
          disabled={(date) => date > new Date()}
          id='endDateInput'
        />
      </div>
    </div>
  );
}
