'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { TIME_RANGE_PRESETS, TimeRangeValue, getDateRangeForTimePresets } from '@/utils/timeRanges';
import {
  getValidGranularityFallback,
  getAllowedGranularities,
  GRANULARITY_RANGE_PRESETS,
  GranularityRangeValues,
} from '@/utils/granularityRanges';
import { format, addDays, differenceInCalendarDays } from 'date-fns';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function TimeRangeSelector({ className = '' }: { className?: string }) {
  const {
    startDate,
    endDate,
    setPeriod,
    granularity,
    setGranularity,
    compareEnabled,
    setCompareEnabled,
    compareStartDate,
    compareEndDate,
    setCompareDateRange,
    userTimezone,
  } = useTimeRangeContext();

  const currentActivePreset = useMemo<TimeRangeValue>(() => {
    if (!startDate || !endDate) {
      return 'custom';
    }
    for (const preset of TIME_RANGE_PRESETS) {
      if (preset.value === 'custom') continue;
      const { startDate: presetStart, endDate: presetEnd } = getDateRangeForTimePresets(
        preset.value,
        userTimezone,
      );
      if (
        presetStart &&
        presetEnd &&
        differenceInCalendarDays(startDate, presetStart) === 0 &&
        differenceInCalendarDays(endDate, presetEnd) === 0
      ) {
        return preset.value;
      }
    }
    return 'custom';
  }, [startDate, endDate, userTimezone]);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);
  const [isCompareStartDatePopoverOpen, setIsCompareStartDatePopoverOpen] = useState(false);
  const [isCompareEndDatePopoverOpen, setIsCompareEndDatePopoverOpen] = useState(false);

  const [tempRange, setTempRange] = useState<TimeRangeValue>(currentActivePreset);
  const [tempGranularity, setTempGranularity] = useState<GranularityRangeValues>(granularity);

  const [tempCustomStart, setTempCustomStart] = useState<Date | undefined>(startDate);
  const [tempCustomEnd, setTempCustomEnd] = useState<Date | undefined>(endDate);
  const [tempCompare, setTempCompare] = useState<boolean>(compareEnabled);
  const [tempCompareStartDate, setTempCompareStartDate] = useState<Date | undefined>(compareStartDate);
  const [tempCompareEndDate, setTempCompareEndDate] = useState<Date | undefined>(compareEndDate);

  useEffect(() => {
    if (!isPopoverOpen) {
      setTempRange(currentActivePreset);
      if (currentActivePreset !== 'custom') {
        const { startDate: presetStart, endDate: presetEnd } = getDateRangeForTimePresets(
          currentActivePreset,
          userTimezone,
        );
        setTempCustomStart(presetStart);
        setTempCustomEnd(presetEnd);
      } else {
        setTempCustomStart(startDate);
        setTempCustomEnd(endDate);
      }
    }
  }, [currentActivePreset, isPopoverOpen, startDate, endDate, userTimezone]);

  const tempMainPeriodDurationDays = useMemo(() => {
    if (tempRange === 'custom' && tempCustomStart && tempCustomEnd) {
      return differenceInCalendarDays(tempCustomEnd, tempCustomStart) + 1;
    }
    if (tempRange !== 'custom') {
      const { startDate: presetStart, endDate: presetEnd } = getDateRangeForTimePresets(tempRange, userTimezone);
      if (presetStart && presetEnd) {
        return differenceInCalendarDays(presetEnd, presetStart) + 1;
      }
    }
    return null;
  }, [tempRange, tempCustomStart, tempCustomEnd, userTimezone]);

  const allowedGranularities = useMemo((): GranularityRangeValues[] => {
    if (tempRange !== 'custom') {
      const { startDate, endDate } = getDateRangeForTimePresets(tempRange, userTimezone);
      return getAllowedGranularities(startDate, endDate);
    }

    if (tempCustomStart && tempCustomEnd) {
      return getAllowedGranularities(tempCustomStart, tempCustomEnd);
    }

    return ['day']; // Should never happen
  }, [tempRange, tempCustomStart, tempCustomEnd, userTimezone]);

  const isGranularityAllowed = useCallback(
    (granularity: GranularityRangeValues) => {
      return allowedGranularities.includes(granularity);
    },
    [allowedGranularities],
  );

  useEffect(() => {
    if (tempCompareStartDate && tempMainPeriodDurationDays !== null) {
      setTempCompareEndDate(addDays(tempCompareStartDate, tempMainPeriodDurationDays - 1));
    }
  }, [tempMainPeriodDurationDays, tempCompareStartDate]);

  useEffect(() => {
    if (!allowedGranularities.includes(tempGranularity)) {
      const validGranularity = getValidGranularityFallback(tempGranularity, allowedGranularities);
      setTempGranularity(validGranularity);
    }
  }, [allowedGranularities, tempGranularity]);

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      setTempRange(currentActivePreset);
      setTempGranularity(granularity);
      setTempCustomStart(startDate);
      setTempCustomEnd(endDate);
      setTempCompare(compareEnabled);
      setTempCompareStartDate(compareStartDate);
      setTempCompareEndDate(compareEndDate);
    }
  };

  const handleApply = () => {
    setGranularity(tempGranularity);
    setCompareEnabled(tempCompare);
    if (tempRange === 'custom' && tempCustomStart && tempCustomEnd) {
      setPeriod(tempCustomStart, tempCustomEnd);
    } else if (tempRange !== 'custom') {
      const { startDate: presetStart, endDate: presetEnd } = getDateRangeForTimePresets(tempRange, userTimezone);
      if (presetStart && presetEnd) {
        setPeriod(presetStart, presetEnd);
      }
    }
    if (tempCompare && tempCompareStartDate && tempCompareEndDate) {
      setCompareDateRange(tempCompareStartDate, tempCompareEndDate);
    }
    setIsPopoverOpen(false);
  };

  const handleQuickSelect = (value: TimeRangeValue) => {
    setTempRange(value);
    if (value !== 'custom') {
      const { startDate: presetStartDate, endDate: presetEndDate } = getDateRangeForTimePresets(
        value,
        userTimezone,
      );
      setTempCustomStart(presetStartDate);
      setTempCustomEnd(presetEndDate);
    }
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setTempCustomStart(date);
    setTempRange('custom');
    setIsStartDatePopoverOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setTempCustomEnd(date);
    setTempRange('custom');
    setIsEndDatePopoverOpen(false);
  };

  const handleCompareStartDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setTempCompareStartDate(date);
    if (tempMainPeriodDurationDays !== null) {
      setTempCompareEndDate(addDays(date, tempMainPeriodDurationDays - 1));
    }
    setIsCompareStartDatePopoverOpen(false);
  };

  const handleCompareEndDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setTempCompareEndDate(date);
    if (tempMainPeriodDurationDays !== null) {
      setTempCompareStartDate(addDays(date, -(tempMainPeriodDurationDays - 1)));
    }
    setIsCompareEndDatePopoverOpen(false);
  };

  const displayRangeLabel = () => {
    if (currentActivePreset === 'custom' && startDate && endDate) {
      return `${format(startDate, 'P')} - ${format(endDate, 'P')}`;
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
        <div>
          <h3 className='mb-2 text-sm font-medium text-gray-500'>Quick select</h3>
          <div className='grid grid-cols-2 gap-2'>
            {TIME_RANGE_PRESETS.filter((p) => p.value !== 'custom').map((preset) => (
              <Button
                key={preset.value}
                variant={tempRange === preset.value ? 'default' : 'outline'}
                onClick={() => handleQuickSelect(preset.value)}
                className='w-full justify-start text-left'
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h3 className='mb-2 text-sm font-medium text-gray-500'>Granularity</h3>
          <div className='flex flex-wrap gap-2'>
            {GRANULARITY_RANGE_PRESETS.map((gran) => {
              const isAllowed = isGranularityAllowed(gran.value);
              return (
                <Button
                  key={gran.value}
                  variant={tempGranularity === gran.value ? 'default' : 'outline'}
                  onClick={() => isAllowed && setTempGranularity(gran.value)}
                  disabled={!isAllowed}
                  className={cn('flex-1', !isAllowed && 'cursor-not-allowed opacity-50')}
                >
                  {gran.label}
                </Button>
              );
            }).reverse()}
          </div>
        </div>

        <div>
          <h3 className='mb-2 text-sm font-medium text-gray-500'>Current period</h3>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1'>
              <Label htmlFor='startDateInput'>Start date</Label>
              <Popover open={isStartDatePopoverOpen} onOpenChange={setIsStartDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start truncate text-left font-normal',
                      !tempCustomStart && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className='h-4 w-4' />
                    {tempCustomStart ? format(tempCustomStart, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='z-[1003] w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={tempCustomStart}
                    onSelect={handleStartDateSelect}
                    disabled={(date) => {
                      if (tempCustomEnd && date > tempCustomEnd) {
                        return true;
                      }
                      return date > new Date();
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className='space-y-1'>
              <Label htmlFor='endDateInput'>End date</Label>
              <Popover open={isEndDatePopoverOpen} onOpenChange={setIsEndDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start truncate text-left font-normal',
                      !tempCustomEnd && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className='h-4 w-4' />
                    {tempCustomEnd ? format(tempCustomEnd, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='z-[1003] w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={tempCustomEnd}
                    onSelect={handleEndDateSelect}
                    disabled={(date) => {
                      if (tempCustomStart && date < tempCustomStart) {
                        return true;
                      }
                      return date > new Date();
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <Checkbox
            id='comparePeriodCheckbox'
            checked={tempCompare}
            onCheckedChange={(checked) => setTempCompare(checked as boolean)}
          />
          <Label htmlFor='comparePeriodCheckbox' className='text-sm font-normal'>
            Compare with previous period
          </Label>
        </div>

        {tempCompare && (
          <>
            <Separator className='my-4' />
            <div>
              <h3 className='mb-2 text-sm font-medium text-gray-500'>Compare to period</h3>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <Label htmlFor='compareStartDateInput'>Start date</Label>
                  <Popover open={isCompareStartDatePopoverOpen} onOpenChange={setIsCompareStartDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start truncate text-left font-normal',
                          !tempCompareStartDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className='h-4 w-4' />
                        {tempCompareStartDate ? format(tempCompareStartDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='z-[1003] w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={tempCompareStartDate}
                        onSelect={handleCompareStartDateSelect}
                        disabled={(date) => {
                          if (tempCompareEndDate && date > tempCompareEndDate) {
                            return true;
                          }
                          return date > new Date();
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='space-y-1'>
                  <Label htmlFor='compareEndDateInput'>End date</Label>
                  <Popover open={isCompareEndDatePopoverOpen} onOpenChange={setIsCompareEndDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start truncate text-left font-normal',
                          !tempCompareEndDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className='h-4 w-4' />
                        {tempCompareEndDate ? format(tempCompareEndDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='z-[1003] w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={tempCompareEndDate}
                        onSelect={handleCompareEndDateSelect}
                        disabled={(date) => {
                          if (tempCompareStartDate && date < tempCompareStartDate) {
                            return true;
                          }
                          return date > new Date();
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator className='my-4' />
        <div className='flex justify-end'>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
