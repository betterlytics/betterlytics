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
import { useTranslations } from 'next-intl';

export function TimeRangeSelector({
  className = '',
  showComparison = true,
}: {
  className?: string;
  showComparison?: boolean;
}) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isMobile = useIsMobile();
  const t = useTranslations('components.timeRange');

  const { context, currentActivePreset, tempState, allowedGranularities, updateTempState, resetTempState } =
    useTimeRangeState();

  const handleApplyChanges = useCallback(
    (finalState: TempState) => {
      const { granularity, compareEnabled, customStart, customEnd, compareStart, compareEnd } = finalState;

      context.setGranularity(granularity);
      context.setCompareMode(compareEnabled ? 'previous' : 'off');

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
    handleCustomDateRangeSelect,
    handleCompareEnabledChange,
    handleCompareDateRangeSelect,
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
    if (!preset) return t('dateRange');
    if (preset.value === 'custom') return t('dateRange');
    return t(`presets.${preset.value}` as const);
  };

  const content = (
    <div className='space-y-6 p-0 sm:p-0'>
      <QuickSelectSection selectedRange={tempState.range} onRangeSelect={handleQuickSelect} />
      <Separator className='my-4' />
      <GranularitySection
        selectedGranularity={tempState.granularity}
        allowedGranularities={allowedGranularities}
        onGranularitySelect={handleGranularitySelect}
      />
      <Separator className='my-4' />
      <DateRangeSection
        startDate={tempState.customStart}
        endDate={tempState.customEnd}
        onDateRangeSelect={handleCustomDateRangeSelect}
      />

      {showComparison && (
        <ComparePeriodSection
          compareEnabled={tempState.compareEnabled}
          onCompareEnabledChange={handleCompareEnabledChange}
          compareStartDate={tempState.compareStart}
          compareEndDate={tempState.compareEnd}
          onDateRangeSelect={handleCompareDateRangeSelect}
        />
      )}

      <Separator className='my-4' />
      <div className='flex justify-end'>
        <Button className='cursor-pointer' onClick={handleApplyAndClose}>
          {t('apply')}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Dialog open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant='secondary'
            role='combobox'
            className={cn(
              'border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent min-w-[200px] cursor-pointer justify-between border bg-transparent shadow-xs transition-[color,box-shadow]',
              className,
            )}
          >
            <div className='flex items-center gap-2'>
              <CalendarIcon className='h-4 w-4' />
              <span>{displayRangeLabel()}</span>
            </div>
            <ChevronDownIcon className={`ml-2 h-4 w-4 shrink-0 opacity-50`} />
          </Button>
        </DialogTrigger>
        <DialogContent className='bg-popover max-h-[85vh] w-[calc(100vw-2rem)] max-w-[420px] overflow-y-auto px-3 py-4'>
          <DialogHeader>
            <DialogTitle>{t('dateRange')}</DialogTitle>
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
          variant='secondary'
          role='combobox'
          className={cn(
            'border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent min-w-[200px] cursor-pointer justify-between border bg-transparent shadow-xs transition-[color,box-shadow]',
            className,
          )}
        >
          <div className='flex items-center gap-2'>
            <CalendarIcon className='h-4 w-4' />
            <span>{displayRangeLabel()}</span>
          </div>
          <ChevronDownIcon className={`ml-2 h-4 w-4 shrink-0 opacity-50`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[350px] max-w-[calc(100svw-48px)] space-y-6 border p-6 shadow-2xl' align='end'>
        {content}
      </PopoverContent>
    </Popover>
  );
}
