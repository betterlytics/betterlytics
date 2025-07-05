'use client';

import React from 'react';
import { GRANULARITY_RANGE_PRESETS, GranularityRangeValues } from '@/utils/granularityRanges';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GranularitySectionProps {
  selectedGranularity: GranularityRangeValues;
  allowedGranularities: GranularityRangeValues[];
  onGranularitySelect: (granularity: GranularityRangeValues) => void;
}

export function GranularitySection({ 
  selectedGranularity, 
  allowedGranularities, 
  onGranularitySelect 
}: GranularitySectionProps) {
  return (
    <div>
      <h3 className='mb-2 text-sm font-medium text-gray-500'>Granularity</h3>
      <div className='flex flex-wrap gap-2'>
        {GRANULARITY_RANGE_PRESETS.map((gran) => {
          const isAllowed = allowedGranularities.includes(gran.value);
          return (
            <Button
              key={gran.value}
              variant={selectedGranularity === gran.value ? 'default' : 'outline'}
              onClick={() => isAllowed && onGranularitySelect(gran.value)}
              disabled={!isAllowed}
              className={cn('flex-1', !isAllowed && 'cursor-not-allowed opacity-50')}
            >
              {gran.label}
            </Button>
          );
        }).reverse()}
      </div>
    </div>
  );
}