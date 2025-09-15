'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslations } from 'next-intl';
import {
  TIME_RANGE_PRESETS,
  TimeRangeValue,
  getDateRangeForTimePresets,
  getStartDateWithGranularity,
  getEndDateWithGranularity,
} from '@/utils/timeRanges';
import {
  GranularityRangeValues,
  getAllowedGranularities,
  getValidGranularityFallback,
  GRANULARITY_RANGE_PRESETS,
} from '@/utils/granularityRanges';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from './DateRangePicker';

type RangeChoice = TimeRangeValue;

export function TimeRangePresetSelector({ className = '' }: { className?: string }) {
  const t = useTranslations('components.timeRange');
  const isMobile = useIsMobile();
  const context = useTimeRangeContext();
  const [open, setOpen] = useState(false);
  const [showCustom] = useState(true);

  const currentActivePreset = useMemo<RangeChoice>(() => {
    if (!context.startDate || !context.endDate) return 'custom';
    for (const preset of TIME_RANGE_PRESETS) {
      const { startDate: pStart, endDate: pEnd } = getDateRangeForTimePresets(
        preset.value as Exclude<TimeRangeValue, 'custom'>,
      );
      const roundedStart = getStartDateWithGranularity(pStart, context.granularity);
      const roundedEnd = getEndDateWithGranularity(pEnd, context.granularity);
      if (
        context.startDate.getTime() === roundedStart.getTime() &&
        context.endDate.getTime() === roundedEnd.getTime()
      ) {
        return preset.value;
      }
    }
    return 'custom';
  }, [context.startDate, context.endDate, context.granularity]);

  const selectedRangeDates = useMemo(() => {
    if (currentActivePreset !== 'custom') {
      return getDateRangeForTimePresets(currentActivePreset as Exclude<TimeRangeValue, 'custom'>);
    }
    return { startDate: context.startDate, endDate: context.endDate };
  }, [currentActivePreset, context.startDate, context.endDate]);

  const allowedGranularities = useMemo<GranularityRangeValues[]>(() => {
    const { startDate, endDate } = selectedRangeDates;
    if (!startDate || !endDate) return ['day'];
    return getAllowedGranularities(startDate, endDate);
  }, [selectedRangeDates]);

  const displayRangeLabel = () => {
    if (currentActivePreset === 'custom' && context.startDate && context.endDate) {
      const startLabel = context.startDate.toLocaleDateString();
      const endLabel = context.endDate.toLocaleDateString();
      return `${startLabel} - ${endLabel}`;
    }
    const preset = TIME_RANGE_PRESETS.find((p) => p.value === currentActivePreset);
    if (!preset) return t('dateRange');
    try {
      return preset.value;
    } catch {
      return preset.label;
    }
  };

  const applyPreset = useCallback(
    (value: Exclude<TimeRangeValue, 'custom'>) => {
      const { startDate, endDate } = getDateRangeForTimePresets(value);
      const validGranularity = getValidGranularityFallback(
        context.granularity,
        getAllowedGranularities(startDate, endDate),
      );

      const gStart = getStartDateWithGranularity(startDate, validGranularity);
      const gEnd = getEndDateWithGranularity(endDate, validGranularity);

      context.setGranularity(validGranularity);
      context.setPeriod(gStart, gEnd);
    },
    [context],
  );

  const applyCustom = useCallback(
    (from?: Date, to?: Date) => {
      if (!from || !to) return;
      const validGranularity = getValidGranularityFallback(context.granularity, getAllowedGranularities(from, to));
      context.setGranularity(validGranularity);
      context.setPeriod(
        getStartDateWithGranularity(from, validGranularity),
        getEndDateWithGranularity(to, validGranularity),
      );
    },
    [context],
  );

  const handleGranularityChange = useCallback(
    (gran: GranularityRangeValues) => {
      if (!allowedGranularities.includes(gran)) return;
      if (currentActivePreset !== 'custom') {
        const { startDate, endDate } = getDateRangeForTimePresets(
          currentActivePreset as Exclude<TimeRangeValue, 'custom'>,
        );
        context.setGranularity(gran);
        context.setPeriod(getStartDateWithGranularity(startDate, gran), getEndDateWithGranularity(endDate, gran));
        return;
      }
      context.setGranularity(gran);
      context.setPeriod(
        getStartDateWithGranularity(context.startDate, gran),
        getEndDateWithGranularity(context.endDate, gran),
      );
    },
    [allowedGranularities, context, currentActivePreset],
  );

  const list = (
    <div className='space-y-4'>
      <div className='grid gap-2'>
        {TIME_RANGE_PRESETS.map((preset) => (
          <Button
            key={preset.value}
            variant={currentActivePreset === preset.value ? 'default' : 'ghost'}
            className='w-full cursor-pointer justify-start'
            onClick={() => applyPreset(preset.value as Exclude<TimeRangeValue, 'custom'>)}
          >
            {(() => {
              try {
                return preset.value;
              } catch {
                return preset.label;
              }
            })()}
          </Button>
        ))}
        <DateRangePicker
          range={{ from: context.startDate, to: context.endDate }}
          onDateRangeSelect={(range) => applyCustom(range?.from, range?.to)}
          trigger={
            <Button
              variant={currentActivePreset === 'custom' ? 'default' : 'ghost'}
              className='w-full cursor-pointer justify-start'
            >
              {'Custom range'}
            </Button>
          }
        />
      </div>

      <Separator />

      <div className='space-y-2'>
        <div className='text-sm font-medium'>{t('granularity')}</div>
        <Select
          value={context.granularity}
          onValueChange={(val) => handleGranularityChange(val as GranularityRangeValues)}
        >
          <SelectTrigger className='border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent w-full cursor-pointer justify-between border bg-transparent shadow-xs transition-[color,box-shadow]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITY_RANGE_PRESETS.map((g) => (
              <SelectItem
                key={g.value}
                value={g.value}
                disabled={!allowedGranularities.includes(g.value)}
                className='cursor-pointer'
              >
                {t(`granularityLabels.${g.value}` as const)}
              </SelectItem>
            )).reverse()}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
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
            <ChevronDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </DialogTrigger>
        <DialogContent className='bg-popover max-h-[85vh] w-[calc(100vw-2rem)] max-w-[420px] overflow-y-auto px-3 py-4'>
          <DialogHeader>
            <DialogTitle>{t('dateRange')}</DialogTitle>
          </DialogHeader>
          {list}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='secondary'
          role='combobox'
          className={cn(
            'border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent min-w-[150px] cursor-pointer justify-between border bg-transparent shadow-xs transition-[color,box-shadow]',
            className,
          )}
        >
          <div className='flex items-center gap-2'>
            <CalendarIcon className='h-4 w-4' />
            <span>{displayRangeLabel()}</span>
          </div>
          <ChevronDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[150px] max-w-[calc(100svw-48px)] space-y-6 border p-2 shadow-2xl' align='end'>
        {list}
      </PopoverContent>
    </Popover>
  );
}

export default TimeRangePresetSelector;
