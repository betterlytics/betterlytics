'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type DateTimePickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
  /** Locale tag (e.g. 'en', 'da') used to format the trigger label. */
  locale?: string;
  /** Accessible label for the trigger button. */
  dateLabel?: string;
  /** Heading shown above the time columns. */
  timeLabel?: string;
  className?: string;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/**
 * Themed date + time picker built from the shared Calendar/Popover primitives,
 * replacing the unstyled native `datetime-local` control. A single trigger
 * opens one popover holding the calendar alongside inline hour/minute columns,
 * so both the day and the time are picked directly in the same popover.
 */
export function DateTimePicker({
  value,
  onChange,
  disabled,
  locale,
  dateLabel,
  timeLabel,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const triggerLabel = value.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const next = new Date(value);
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    onChange(next);
  };

  const setHour = (hour: number) => {
    const next = new Date(value);
    next.setHours(hour, value.getMinutes(), 0, 0);
    onChange(next);
  };

  const setMinute = (minute: number) => {
    const next = new Date(value);
    next.setMinutes(minute, 0, 0);
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          disabled={disabled}
          aria-label={dateLabel}
          className={cn('h-9 cursor-pointer justify-start gap-2 font-normal', className)}
        >
          <CalendarIcon className='h-4 w-4 opacity-70' />
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <div className='flex max-sm:flex-col'>
          <Calendar
            mode='single'
            required
            selected={value}
            onSelect={handleDaySelect}
            defaultMonth={value}
            autoFocus
            className='[&_button]:cursor-pointer'
          />
          <div className='border-border flex flex-col border-t sm:border-t-0 sm:border-l'>
            <div className='text-muted-foreground border-border border-b px-3 py-2 text-xs font-medium'>
              {timeLabel}
            </div>
            <div className='divide-border flex divide-x'>
              <TimeColumn options={HOURS} selected={value.getHours()} onSelect={setHour} open={open} ariaLabel='Hours' />
              <TimeColumn
                options={MINUTES}
                selected={value.getMinutes()}
                onSelect={setMinute}
                open={open}
                ariaLabel='Minutes'
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({
  options,
  selected,
  onSelect,
  open,
  ariaLabel,
}: {
  options: number[];
  selected: number;
  onSelect: (value: number) => void;
  open: boolean;
  ariaLabel: string;
}) {
  const selectedRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (open) selectedRef.current?.scrollIntoView({ block: 'center' });
  }, [open]);

  return (
    <ScrollArea className='h-64 w-14' aria-label={ariaLabel}>
      <div className='flex flex-col gap-1 p-2'>
        {options.map((option) => (
          <Button
            key={option}
            ref={option === selected ? selectedRef : undefined}
            type='button'
            size='sm'
            variant={option === selected ? 'default' : 'ghost'}
            aria-pressed={option === selected}
            onClick={() => onSelect(option)}
            className='h-8 w-full cursor-pointer justify-center px-0 font-normal tabular-nums'
          >
            {pad(option)}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
