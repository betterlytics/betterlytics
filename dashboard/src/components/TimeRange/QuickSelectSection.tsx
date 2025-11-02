'use client';

import React from 'react';
import { TIME_RANGE_PRESETS, TimeRangeValue, TimeRangePreset } from '@/utils/timeRanges';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
import { DisabledTooltip } from '@/components/ui/DisabledTooltip';

interface QuickSelectSectionProps {
  selectedRange: TimeRangeValue;
  onRangeSelect: (value: TimeRangeValue) => void;
  allowedValues?: Array<Exclude<TimeRangeValue, 'custom'>>;
}

export function QuickSelectSection({ selectedRange, onRangeSelect, allowedValues }: QuickSelectSectionProps) {
  const t = useTranslations('components.timeRange');
  const tDemo = useTranslations('components.demoMode');

  const isNonCustomPreset = (
    preset: TimeRangePreset,
  ): preset is TimeRangePreset & { value: Exclude<TimeRangeValue, 'custom'> } => preset.value !== 'custom';
  const byValue = new Map(TIME_RANGE_PRESETS.filter(isNonCustomPreset).map((p) => [p.value, p]));

  const groups: Array<Array<Exclude<TimeRangeValue, 'custom'>>> = [
    ['realtime', '1h', '24h', 'today', 'yesterday'],
    ['7d', '28d', '90d'],
    ['mtd', 'last_month', 'ytd', '1y'],
  ];

  const renderButton = (value: Exclude<TimeRangeValue, 'custom'>) => {
    const preset = byValue.get(value);
    if (!preset) return null;
    const isAllowed = allowedValues ? allowedValues.includes(value) : true;
    return (
      <DisabledTooltip disabled={!isAllowed} message={tDemo('notAvailable')} wrapperClassName='w-full'>
        {() => (
          <Button
            key={preset.value}
            variant={selectedRange === preset.value ? 'default' : 'ghost'}
            onClick={() => isAllowed && onRangeSelect(preset.value)}
            className='h-8 w-full cursor-pointer justify-start rounded-sm px-2 text-center'
            disabled={!isAllowed}
          >
            {t(`presets.${preset.value}`)}
          </Button>
        )}
      </DisabledTooltip>
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
