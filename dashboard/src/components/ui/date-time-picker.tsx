'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useDisplayHour12 } from '@/hooks/use-display-hour12';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type DateTimePickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
  locale?: string;
  dateLabel?: string;
  timeLabel?: string;
  className?: string;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TWELVE_HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

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
  const hour12 = useDisplayHour12();

  const meridiem: 'AM' | 'PM' = value.getHours() >= 12 ? 'PM' : 'AM';
  const displayHour = hour12 ? ((value.getHours() + 11) % 12) + 1 : value.getHours();

  const triggerLabel = value.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12,
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

  const setHour12 = (display: number) => {
    const isPM = value.getHours() >= 12;
    const hour = display === 12 ? (isPM ? 12 : 0) : isPM ? display + 12 : display;
    const next = new Date(value);
    next.setHours(hour, value.getMinutes(), 0, 0);
    onChange(next);
  };

  const setMeridiem = (next: 'AM' | 'PM') => {
    if (next === meridiem) return;
    const shifted = new Date(value);
    shifted.setHours(value.getHours() + (next === 'PM' ? 12 : -12), value.getMinutes(), 0, 0);
    onChange(shifted);
  };

  return (
    // modal: without it, a parent Sheet's scroll lock swallows wheel events over the portaled popover.
    <Popover open={open} onOpenChange={setOpen} modal>
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
              <TimeColumn
                options={hour12 ? TWELVE_HOURS : HOURS}
                selected={displayHour}
                onSelect={hour12 ? setHour12 : setHour}
                open={open}
                ariaLabel='Hours'
              />
              <TimeColumn
                options={MINUTES}
                selected={value.getMinutes()}
                onSelect={setMinute}
                open={open}
                ariaLabel='Minutes'
              />
              {hour12 && <MeridiemColumn value={meridiem} onSelect={setMeridiem} />}
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

function MeridiemColumn({ value, onSelect }: { value: 'AM' | 'PM'; onSelect: (value: 'AM' | 'PM') => void }) {
  return (
    <div className='flex flex-col gap-1 p-2' aria-label='AM/PM'>
      {(['AM', 'PM'] as const).map((option) => (
        <Button
          key={option}
          type='button'
          size='sm'
          variant={option === value ? 'default' : 'ghost'}
          aria-pressed={option === value}
          onClick={() => onSelect(option)}
          className='h-8 w-12 cursor-pointer justify-center px-0 font-normal'
        >
          {option}
        </Button>
      ))}
    </div>
  );
}
