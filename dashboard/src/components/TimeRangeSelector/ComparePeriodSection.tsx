'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from './DatePicker';

interface ComparePeriodSectionProps {
  compareEnabled: boolean;
  onCompareEnabledChange: (enabled: boolean) => void;
  compareStartDate: Date | undefined;
  compareEndDate: Date | undefined;
  onCompareStartDateSelect: (date: Date | undefined) => void;
  onCompareEndDateSelect: (date: Date | undefined) => void;
}

export function ComparePeriodSection({
  compareEnabled,
  onCompareEnabledChange,
  compareStartDate,
  compareEndDate,
  onCompareStartDateSelect,
  onCompareEndDateSelect,
}: ComparePeriodSectionProps) {
  return (
    <>
      <div className='flex items-center space-x-2'>
        <Checkbox
          id='comparePeriodCheckbox'
          checked={compareEnabled}
          onCheckedChange={(checked) => onCompareEnabledChange(checked as boolean)}
        />
        <Label htmlFor='comparePeriodCheckbox' className='text-sm font-normal'>
          Compare with previous period
        </Label>
      </div>

      {compareEnabled && (
        <>
          <Separator className='my-4' />
          <div>
            <h3 className='mb-2 text-sm font-medium text-gray-500'>Compare to period</h3>
            <div className='grid grid-cols-2 gap-4'>
              <DatePicker
                label='Start date'
                date={compareStartDate}
                onDateSelect={(date) => onCompareStartDateSelect(date as Date)}
                disabled={(date) => {
                  if (compareEndDate && date > compareEndDate) {
                    return true;
                  }
                  return date > new Date();
                }}
                id='compareStartDateInput'
              />
              <DatePicker
                label='End date'
                date={compareEndDate}
                onDateSelect={(date) => onCompareEndDateSelect(date as Date)}
                disabled={(date) => {
                  if (compareStartDate && date < compareStartDate) {
                    return true;
                  }
                  return date > new Date();
                }}
                id='compareEndDateInput'
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
