'use client';

import React from 'react';
import { TIME_RANGE_PRESETS, TimeRangeValue, TimeRangePreset } from '@/utils/timeRanges';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface QuickSelectSectionProps {
  selectedRange: TimeRangeValue;
  onRangeSelect: (value: TimeRangeValue) => void;
}

export function QuickSelectSection({ selectedRange, onRangeSelect }: QuickSelectSectionProps) {
  const t = useTranslations('components.timeRange');

  const isNonCustomPreset = (
    preset: TimeRangePreset,
  ): preset is TimeRangePreset & { value: Exclude<TimeRangeValue, 'custom'> } => preset.value !== 'custom';
  return (
    <div>
      <h3 className='text-text mb-2 text-sm font-medium'>{t('quickSelect')}</h3>
      <div className='grid grid-cols-2 gap-2'>
        {TIME_RANGE_PRESETS.filter(isNonCustomPreset).map((preset) => (
          <Button
            key={preset.value}
            variant={selectedRange === preset.value ? 'default' : 'outline'}
            onClick={() => onRangeSelect(preset.value)}
            className='w-full px-3 text-center'
          >
            {t(`presets.${preset.value}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
