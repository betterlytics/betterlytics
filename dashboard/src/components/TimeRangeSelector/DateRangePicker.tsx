'use client';

import React, { useCallback, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { type DateRange } from 'react-day-picker';

interface DateRangePickerProps {
  range: DateRange | undefined;
  onDateRangeSelect: (date: DateRange | undefined) => void;
  id?: string;
}

export function DateRangePicker({ range, onDateRangeSelect }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = useCallback(
    (selectedDate: DateRange | undefined) => {
      onDateRangeSelect(selectedDate);
    },
    [onDateRangeSelect],
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
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='range'
            selected={range}
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
