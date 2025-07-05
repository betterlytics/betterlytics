'use client';

import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { TIME_RANGE_PRESETS } from '@/utils/timeRanges';

import { QuickSelectSection } from './QuickSelectSection';
import { GranularitySection } from './GranularitySection';
import { DateRangeSection } from './DateRangeSection';
import { ComparePeriodSection } from './ComparePeriodSection';
import { useTimeRangeState } from './hooks/useTimeRangeState';
import { TempState, useTimeRangeHandlers } from './hooks/useTimeRangeHandlers';

export function TimeRangeSelector({ className = '' }: { className?: string }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { context, currentActivePreset, tempState, allowedGranularities, updateTempState, resetTempState } =
    useTimeRangeState();

  const handleApplyChanges = useCallback(
    (finalState: TempState) => {
      const { granularity, compareEnabled, customStart, customEnd, compareStart, compareEnd } = finalState;

      context.setGranularity(granularity);
      context.setCompareEnabled(compareEnabled);

      if (customStart && customEnd) {
        context.setPeriod(customStart, customEnd);
      }

      if (compareEnabled && compareStart && compareEnd) {
        context.setCompareDateRange(compareStart, compareEnd);
      }
    },
    [context],
  );

  const {
    handleQuickSelect,
    handleGranularitySelect,
    handleStartDateSelect,
    handleEndDateSelect,
    handleCompareEnabledChange,
    handleCompareStartDateSelect,
    handleCompareEndDateSelect,
    handleApply,
  } = useTimeRangeHandlers({
    tempState,
    updateTempState,
    allowedGranularities,
    onApply: handleApplyChanges,
  });

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      resetTempState();
    }
  };

  const handleApplyAndClose = () => {
    handleApply();
    setIsPopoverOpen(false);
  };

  const displayRangeLabel = () => {
    if (currentActivePreset === 'custom' && context.startDate && context.endDate) {
      const startLabel = format(context.startDate, 'P');
      const endLabel = format(context.endDate, 'P');
      return `${startLabel} - ${endLabel}`;
    }
    const preset = TIME_RANGE_PRESETS.find((p) => p.value === currentActivePreset);
    return preset ? preset.label : 'Date Range';
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          className={cn('min-w-[200px] justify-between shadow-sm', className)}
        >
          <div className='flex items-center gap-2'>
            <CalendarIcon className='h-4 w-4' />
            <span>{displayRangeLabel()}</span>
          </div>
          <ChevronDownIcon className={`ml-2 h-4 w-4 shrink-0 opacity-50`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='z-[1002] w-96 space-y-6 p-6' align='end'>
        <QuickSelectSection selectedRange={tempState.range} onRangeSelect={handleQuickSelect} />

        <GranularitySection
          selectedGranularity={tempState.granularity}
          allowedGranularities={allowedGranularities}
          onGranularitySelect={handleGranularitySelect}
        />

        <DateRangeSection
          startDate={tempState.customStart}
          endDate={tempState.customEnd}
          onStartDateSelect={handleStartDateSelect}
          onEndDateSelect={handleEndDateSelect}
        />

        <ComparePeriodSection
          compareEnabled={tempState.compareEnabled}
          onCompareEnabledChange={handleCompareEnabledChange}
          compareStartDate={tempState.compareStart}
          compareEndDate={tempState.compareEnd}
          onCompareStartDateSelect={handleCompareStartDateSelect}
          onCompareEndDateSelect={handleCompareEndDateSelect}
        />

        <Separator className='my-4' />
        <div className='flex justify-end'>
          <Button onClick={handleApplyAndClose}>Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
