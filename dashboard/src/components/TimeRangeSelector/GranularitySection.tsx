'use client';

import React from 'react';
import { GRANULARITY_RANGE_PRESETS, GranularityRangeValues } from '@/utils/granularityRanges';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';

interface GranularitySectionProps {
  selectedGranularity: GranularityRangeValues;
  allowedGranularities: GranularityRangeValues[];
  onGranularitySelect: (granularity: GranularityRangeValues) => void;
}

export function GranularitySection({
  selectedGranularity,
  allowedGranularities,
  onGranularitySelect,
}: GranularitySectionProps) {
  const t = useTranslations('components.timeRange');
  return (
    <div>
      <h3 className='mb-2 text-sm font-medium'>{t('granularity')}</h3>
      <Select
        value={selectedGranularity}
        onValueChange={(value) => onGranularitySelect(value as GranularityRangeValues)}
      >
        <SelectTrigger className='w-full'>
          <SelectValue placeholder={t(`granularityLabels.${selectedGranularity}`)} />
        </SelectTrigger>
        <SelectContent>
          {GRANULARITY_RANGE_PRESETS.map((gran) => (
            <SelectItem key={gran.value} value={gran.value} disabled={!allowedGranularities.includes(gran.value)}>
              {t(`granularityLabels.${gran.value}`)}
            </SelectItem>
          )).reverse()}
        </SelectContent>
      </Select>
    </div>
  );
}
