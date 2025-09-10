'use client';

import React, { useCallback, useState } from 'react';
import { addMonths, format, startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { type DateRange } from 'react-day-picker';
import { useToggle } from '@/hooks/use-toggle';
import { useIsMobile } from '@/hooks/use-mobile';

interface DateRangePickerProps {
  range: DateRange | undefined;
  onDateRangeSelect: (date: DateRange | undefined) => void;
  id?: string;
}

export function DateRangePicker({ range, onDateRangeSelect }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isMobile = useIsMobile();

  const { isOn: selectStartDate, toggle: toggleDateSelect, setOff: setSelectEndDate } = useToggle(true);

  const handleDateSelect = useCallback(
    (selectedRange: DateRange | undefined) => {
      // Since Calendar has it's own implementation of which date to select (start/end)
      // this code is used to figure out which date has just been selected by the user
      const selectedDate =
        selectedRange?.from &&
        range?.from &&
        startOfDay(range.from).getTime() !== startOfDay(selectedRange.from).getTime()
          ? selectedRange.from
          : selectedRange?.to;

      if (!selectedDate) {
        return onDateRangeSelect(selectedRange);
      }

      if (selectStartDate) {
        if (range?.to === undefined || startOfDay(selectedDate) > startOfDay(range.to)) {
          onDateRangeSelect({ from: selectedDate, to: undefined });
          return setSelectEndDate();
        } else {
          onDateRangeSelect({ from: selectedDate, to: range?.to });
        }
      } else {
        if (range?.from === undefined || startOfDay(selectedDate) < startOfDay(range.from)) {
          onDateRangeSelect({ from: selectedDate, to: undefined });
          return setSelectEndDate();
        } else {
          onDateRangeSelect({ from: range?.from, to: selectedDate });
        }
      }
      return toggleDateSelect();
    },
    [range, onDateRangeSelect, selectStartDate, setSelectEndDate],
  );

  return (
    <div className='space-y-1'>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-full cursor-pointer truncate text-left font-normal',
              !range && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className='h-4 w-4' />
            <div className='ml-2'>
              {range?.from && range?.to ? (
                `${format(range.from, 'PP')} - ${format(range.to, 'PP')}`
              ) : (
                <span>Pick a date</span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start' side={isMobile ? 'top' : 'bottom'}>
          <Calendar
            mode='range'
            selected={{
              from: range?.from && startOfDay(range.from),
              to: range?.to && startOfDay(range.to),
            }}
            startMonth={new Date(2019, 0)}
            endMonth={addMonths(new Date(), 1)}
            onSelect={handleDateSelect}
            captionLayout='dropdown'
            className='[&_button]:cursor-pointer [&_select]:cursor-pointer'
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
