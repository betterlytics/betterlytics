'use client';

import React from 'react';
import { GRANULARITY_RANGE_PRESETS, GranularityRangeValues } from '@/utils/granularityRanges';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';

interface GranularitySectionProps {
  selectedGranularity: GranularityRangeValues;
  allowedGranularities: GranularityRangeValues[];
  onGranularitySelect: (granularity: GranularityRangeValues) => void;
  disabled?: boolean;
  disabledTitle?: string;
}

export function GranularitySection({
  selectedGranularity,
  allowedGranularities,
  onGranularitySelect,
  disabled,
  disabledTitle: disabledTitle,
}: GranularitySectionProps) {
  const t = useTranslations('components.timeRange');
  const ordered = GRANULARITY_RANGE_PRESETS.slice().reverse();

  return (
    <div className='mt-2 w-full'>
      <div className='bg-secondary dark:inset-shadow-background grid w-full grid-cols-4 items-center gap-0.5 rounded-sm border p-0.5 shadow-sm dark:inset-shadow-xs'>
        {ordered.map((gran) => {
          const isActive = selectedGranularity === gran.value && !disabled;
          const isAllowed = allowedGranularities.includes(gran.value);
          const showTooltip = !isAllowed && !disabled && disabledTitle !== undefined;
          return (
            <DisabledTooltip key={gran.value} disabled={showTooltip} message={disabledTitle ?? ''}>
              {() => (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className={cn(
                    'h-7 w-full cursor-pointer rounded-[4px] border border-transparent px-2 text-[10px] font-medium',
                    !isAllowed && 'cursor-not-allowed opacity-50 hover:opacity-50',
                    isActive
                      ? 'bg-input text-foreground border-border hover:bg-input hover:dark:bg-input shadow-sm'
                      : 'text-muted-foreground hover:bg-accent',
                  )}
                  disabled={!isAllowed || disabled}
                  aria-pressed={isActive}
                  onClick={() => isAllowed && onGranularitySelect(gran.value)}
                >
                  {t(`granularityLabels.${gran.value}`)}
                </Button>
              )}
            </DisabledTooltip>
          );
        })}
      </div>
    </div>
  );
}
