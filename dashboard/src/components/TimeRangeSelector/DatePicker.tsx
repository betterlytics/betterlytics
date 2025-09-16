'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  label: string;
  date: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  id?: string;
}

export function DatePicker({ label, date, onDateSelect, disabled, id }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateSelect(selectedDate);
    setIsOpen(false);
  };

  return (
    <div className='space-y-1'>
      <Label htmlFor={id} className='text-muted-foreground'>
        {label}
      </Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn('w-full justify-start truncate text-left font-normal', !date && 'text-muted-foreground')}
          >
            <CalendarIcon className='h-4 w-4' />
            {date ? format(date, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar mode='single' selected={date} onSelect={handleDateSelect} disabled={disabled} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  );
}
