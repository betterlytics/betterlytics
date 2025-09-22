'use client';

import React from 'react';
import { TIME_RANGE_PRESETS, TimeRangeValue, TimeRangePreset } from '@/utils/timeRanges';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  const byValue = new Map(TIME_RANGE_PRESETS.filter(isNonCustomPreset).map((p) => [p.value, p]));

  const groups: Array<Array<Exclude<TimeRangeValue, 'custom'> | 'realtime'>> = [
    ['realtime', '1h', '24h', 'today', 'yesterday'],
    ['7d', '28d', '90d'],
    ['mtd', 'last_month', 'ytd', '1y'],
  ];

  const renderButton = (value: Exclude<TimeRangeValue, 'custom'>) => {
    const preset = byValue.get(value);
    if (!preset) return null;
    return (
      <Button
        key={preset.value}
        variant={selectedRange === preset.value ? 'default' : 'ghost'}
        onClick={() => onRangeSelect(preset.value)}
        className='h-8 w-full cursor-pointer justify-start rounded-sm px-2 text-center'
      >
        {t(`presets.${preset.value}`)}
      </Button>
    );
  };

  return (
    <div className='m-0 grid grid-cols-1 gap-1'>
      {groups.map((values, idx) => (
        <React.Fragment key={idx}>
          {values.map((v) => renderButton(v))}
          {idx < groups.length - 1 && <Separator className='my-0' />}
        </React.Fragment>
      ))}
    </div>
  );
}
