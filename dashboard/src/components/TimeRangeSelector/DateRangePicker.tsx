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
  onDateRangeSelect: (dateRange: DateRange | undefined) => void;
  id?: string;
}

export function DateRangePicker({ range, onDateRangeSelect }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isMobile = useIsMobile();

  const { isOn: selectStartDate, toggle: toggleDateSelect, setOff: setSelectEndDate } = useToggle(true);

  const handleDateSelect = useCallback(
    (selectedRange: DateRange | undefined) => {
      if (!selectedRange) {
        onDateRangeSelect(undefined);
        return;
      }

      const selected = getClickedDate(selectedRange, range);

      if (!selected) {
        return onDateRangeSelect(selectedRange);
      }

      const { newRange, setSelectEnd, shouldToggle } = computeSelectionRange(selected, range, selectStartDate);

      onDateRangeSelect(newRange);

      if (setSelectEnd) {
        setSelectEndDate();
        return;
      }

      if (shouldToggle) {
        toggleDateSelect();
      }
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

type DateRangeResult = {
  newRange: DateRange;
  setSelectEnd: boolean;
  shouldToggle: boolean;
};

function normalize(date?: Date) {
  return date ? startOfDay(date).getTime() : undefined;
}

function getClickedDate(selectedRange: DateRange | undefined, range: DateRange | undefined) {
  if (!selectedRange) return undefined;

  // Since Calendar has it's own implementation of which date to select (start/end)
  // this code is used to figure out which date has just been selected by the user
  if (selectedRange.from && range?.from && normalize(range.from) !== normalize(selectedRange.from)) {
    return selectedRange.from;
  } else {
    return selectedRange.to;
  }
}

const computeSelectionRange = (
  selectedDate: Date,
  range: DateRange | undefined,
  selectStartDate: boolean,
): DateRangeResult => {
  const selectedTime = normalize(selectedDate)!;
  const fromTime = normalize(range?.from);
  const toTime = normalize(range?.to);

  if (selectStartDate) {
    if (toTime === undefined || selectedTime > toTime) {
      return { newRange: { from: selectedDate, to: undefined }, setSelectEnd: true, shouldToggle: false };
    }
    return { newRange: { from: selectedDate, to: range?.to }, setSelectEnd: false, shouldToggle: true };
  }

  if (fromTime === undefined || selectedTime < fromTime) {
    return { newRange: { from: selectedDate, to: undefined }, setSelectEnd: true, shouldToggle: false };
  }
  return { newRange: { from: range?.from, to: selectedDate }, setSelectEnd: false, shouldToggle: true };
};
