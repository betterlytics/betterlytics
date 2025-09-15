'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DateRangePicker } from './DateRangePicker';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { getPreviousPeriodForRange, getYearOverYearForRange } from '@/utils/timeRanges';
import { useIsMobile } from '@/hooks/use-mobile';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type CompareMode = 'off' | 'previous' | 'yoy' | 'custom';

export function CompareSelector() {
  const ctx = useTimeRangeContext();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const detectedMode: CompareMode = useMemo(() => {
    if (!ctx.compareEnabled) return 'off';
    if (!ctx.compareStartDate || !ctx.compareEndDate) return 'custom';
    const prev = getPreviousPeriodForRange(ctx.startDate, ctx.endDate);
    if (
      ctx.compareStartDate.getTime() === prev.compareStart.getTime() &&
      ctx.compareEndDate.getTime() === prev.compareEnd.getTime()
    ) {
      return 'previous';
    }
    const yoy = getYearOverYearForRange(ctx.startDate, ctx.endDate);
    if (
      ctx.compareStartDate.getTime() === yoy.compareStart.getTime() &&
      ctx.compareEndDate.getTime() === yoy.compareEnd.getTime()
    ) {
      return 'yoy';
    }
    return 'custom';
  }, [ctx.compareEnabled, ctx.compareStartDate, ctx.compareEndDate, ctx.startDate, ctx.endDate]);

  const applyOff = () => {
    ctx.setCompareEnabled(false);
    setOpen(false);
  };

  const applyPrevious = () => {
    const { compareStart, compareEnd } = getPreviousPeriodForRange(ctx.startDate, ctx.endDate);
    ctx.setCompareEnabled(true);
    ctx.setCompareDateRange(compareStart, compareEnd);
    setOpen(false);
  };

  const applyYoY = () => {
    const { compareStart, compareEnd } = getYearOverYearForRange(ctx.startDate, ctx.endDate);
    ctx.setCompareEnabled(true);
    ctx.setCompareDateRange(compareStart, compareEnd);
    setOpen(false);
  };

  const applyCustom = (from?: Date, to?: Date) => {
    if (!from || !to) return;
    ctx.setCompareEnabled(true);
    ctx.setCompareDateRange(from, to);
  };

  const content = (
    <div className='space-y-4'>
      <div className='grid gap-2'>
        <Button
          variant={detectedMode === 'off' ? 'default' : 'ghost'}
          className='w-full cursor-pointer justify-start'
          onClick={applyOff}
        >
          No comparison
        </Button>
        <Button variant='ghost' className='w-full cursor-pointer justify-start' onClick={applyPrevious}>
          Previous period
        </Button>
        <Button variant='ghost' className='w-full cursor-pointer justify-start' onClick={applyYoY}>
          Year over year
        </Button>
        <DateRangePicker
          range={{ from: ctx.compareStartDate, to: ctx.compareEndDate }}
          onDateRangeSelect={(range) => applyCustom(range?.from, range?.to)}
          trigger={
            <Button
              variant={detectedMode === 'custom' ? 'default' : 'ghost'}
              className='w-full cursor-pointer justify-start'
            >
              Custom period
            </Button>
          }
        />
      </div>

      <Separator />
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
              'border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent min-w-[150px] cursor-pointer justify-between border bg-transparent shadow-xs transition-[color,box-shadow]',
            )}
          >
            <div className='flex items-center gap-2'>
              <CalendarIcon className='h-4 w-4' />
              <span>{detectedMode}</span>
            </div>
            <ChevronDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </DialogTrigger>
        <DialogContent className='bg-popover max-h-[85vh] w-[calc(100vw-2rem)] max-w-[420px] overflow-y-auto px-3 py-4'>
          <DialogHeader>
            <DialogTitle>Comparison</DialogTitle>
          </DialogHeader>
          {content}
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
          )}
        >
          <div className='flex items-center gap-2'>
            <CalendarIcon className='h-4 w-4' />
            <span>{detectedMode}</span>
          </div>
          <ChevronDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[150px] max-w-[calc(100svw-48px)] space-y-6 border p-2 shadow-2xl' align='end'>
        {content}
      </PopoverContent>
    </Popover>
  );
}

export default CompareSelector;
