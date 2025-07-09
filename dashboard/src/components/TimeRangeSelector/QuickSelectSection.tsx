'use client';

import React from 'react';
import { TIME_RANGE_PRESETS, TimeRangeValue } from '@/utils/timeRanges';
import { Button } from '@/components/ui/button';

interface QuickSelectSectionProps {
  selectedRange: TimeRangeValue;
  onRangeSelect: (value: TimeRangeValue) => void;
}

export function QuickSelectSection({ selectedRange, onRangeSelect }: QuickSelectSectionProps) {
  return (
    <div>
      <h3 className='mb-2 text-sm font-medium text-gray-500'>Quick select</h3>
      <div className='grid grid-cols-2 gap-2'>
        {TIME_RANGE_PRESETS.filter((p) => p.value !== 'custom').map((preset) => (
          <Button
            key={preset.value}
            variant={selectedRange === preset.value ? 'default' : 'outline'}
            onClick={() => onRangeSelect(preset.value)}
            className='w-full justify-start text-left'
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}