'use client';

import React, { useState, useCallback } from 'react';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { TIME_RANGE_PRESETS } from '@/utils/timeRanges';

import { QuickSelectSection } from './QuickSelectSection';
import { GranularitySection } from './GranularitySection';
import { DateRangeSection } from './DateRangeSection';
import { ComparePeriodSection } from './ComparePeriodSection';
import { useTimeRangeState } from './hooks/useTimeRangeState';
import { TempState, useTimeRangeHandlers } from './hooks/useTimeRangeHandlers';
import { useIsMobile } from '@/hooks/use-mobile';

export function TimeRangeSelector({
  className = '',
  showComparison = true,
}: {
  className?: string;
  showComparison?: boolean;
}) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isMobile = useIsMobile();

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
      const startLabel = context.startDate.toLocaleDateString();
      const endLabel = context.endDate.toLocaleDateString();
      return `${startLabel} - ${endLabel}`;
    }
    const preset = TIME_RANGE_PRESETS.find((p) => p.value === currentActivePreset);
    return preset ? preset.label : 'Date Range';
  };

  const content = (
    <div className='space-y-6 p-0 sm:p-0'>
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

      {showComparison && (
        <ComparePeriodSection
          compareEnabled={tempState.compareEnabled}
          onCompareEnabledChange={handleCompareEnabledChange}
          compareStartDate={tempState.compareStart}
          compareEndDate={tempState.compareEnd}
          onCompareStartDateSelect={handleCompareStartDateSelect}
          onCompareEndDateSelect={handleCompareEndDateSelect}
        />
      )}

      <Separator className='my-4' />
      <div className='flex justify-end'>
        <Button onClick={handleApplyAndClose}>Apply</Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Dialog open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
        <DialogTrigger asChild>
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
        </DialogTrigger>
        <DialogContent className='max-h-[85vh] w-[calc(100vw-2rem)] max-w-[420px] overflow-y-auto p-6'>
          <DialogHeader>
            <DialogTitle>Date range</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

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
      <PopoverContent className='w-[415px] max-w-[calc(100svw-48px)] space-y-6 p-6' align='end'>
        {content}
      </PopoverContent>
    </Popover>
  );
}
