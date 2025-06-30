'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from './DatePicker';
import type { TZDate } from '@/utils/timezoneHelpers';

interface ComparePeriodSectionProps {
  compareEnabled: boolean;
  onCompareEnabledChange: (enabled: boolean) => void;
  compareStartDate: TZDate | undefined;
  compareEndDate: TZDate | undefined;
  onCompareStartDateSelect: (date: TZDate | undefined) => void;
  onCompareEndDateSelect: (date: TZDate | undefined) => void;
  userTimezone?: string;
}

export function ComparePeriodSection({
  compareEnabled,
  onCompareEnabledChange,
  compareStartDate,
  compareEndDate,
  onCompareStartDateSelect,
  onCompareEndDateSelect,
  userTimezone,
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
                onDateSelect={(date) => onCompareStartDateSelect(date as TZDate)}
                disabled={(date) => {
                  if (compareEndDate && date > compareEndDate) {
                    return true;
                  }
                  return date > new Date();
                }}
                id='compareStartDateInput'
                userTimezone={userTimezone}
              />
              <DatePicker
                label='End date'
                date={compareEndDate}
                onDateSelect={(date) => onCompareEndDateSelect(date as TZDate)}
                disabled={(date) => {
                  if (compareStartDate && date < compareStartDate) {
                    return true;
                  }
                  return date > new Date();
                }}
                id='compareEndDateInput'
                userTimezone={userTimezone}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
