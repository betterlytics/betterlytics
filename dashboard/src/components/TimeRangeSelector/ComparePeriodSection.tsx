'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from './DatePicker';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('components.timeRange');
  return (
    <>
      <div className='flex items-center space-x-2'>
        <Checkbox
          id='comparePeriodCheckbox'
          checked={compareEnabled}
          onCheckedChange={(checked) => onCompareEnabledChange(checked as boolean)}
        />
        <Label htmlFor='comparePeriodCheckbox' className='text-sm font-normal'>
          {t('compareWithPrevious')}
        </Label>
      </div>

      {compareEnabled && (
        <>
          <Separator className='my-4' />
          <div>
            <h3 className='mb-2 text-sm font-medium text-gray-500'>{t('compareToPeriod')}</h3>
            <div className='grid grid-cols-2 gap-4'>
              <DatePicker
                label={t('startDate')}
                date={compareStartDate}
                onDateSelect={(date) => date && onCompareStartDateSelect(date)}
                disabled={(date) => date > new Date()}
                id='compareStartDateInput'
              />
              <DatePicker
                label={t('endDate')}
                date={compareEndDate}
                onDateSelect={(date) => date && onCompareEndDateSelect(date)}
                disabled={(date) => {
                  if (date > new Date()) return true;
                  if (compareStartDate && date < compareStartDate) return true;
                  return false;
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
