'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
import { DateRangePicker } from './DateRangePicker';

interface ComparePeriodSectionProps {
  compareEnabled: boolean;
  onCompareEnabledChange: (enabled: boolean) => void;
  compareStartDate: Date | undefined;
  compareEndDate: Date | undefined;
  onDateRangeSelect: (from: Date | undefined, to: Date | undefined) => void;
}

export function ComparePeriodSection({
  compareEnabled,
  onCompareEnabledChange,
  compareStartDate,
  compareEndDate,
  onDateRangeSelect,
}: ComparePeriodSectionProps) {
  const t = useTranslations('components.timeRange');
  return (
    <>
      <div className='flex items-center space-x-2'>
        <Checkbox
          id='comparePeriodCheckbox'
          className='cursor-pointer'
          checked={compareEnabled}
          onCheckedChange={(checked) => onCompareEnabledChange(checked as boolean)}
        />
        <Label htmlFor='comparePeriodCheckbox' className='cursor-pointer text-sm font-normal'>
          {t('compareWithPrevious')}
        </Label>
      </div>

      {compareEnabled && (
        <>
          <Separator className='my-4' />
          <div>
            <h3 className='text-text mb-2 text-sm font-medium'>{t('compareToPeriod')}</h3>
            <div className='grid gap-4'>
              <DateRangePicker
                onDateRangeSelect={(range) => {
                  onDateRangeSelect(range?.from, range?.to);
                }}
                range={{
                  from: compareStartDate,
                  to: compareEndDate,
                }}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
