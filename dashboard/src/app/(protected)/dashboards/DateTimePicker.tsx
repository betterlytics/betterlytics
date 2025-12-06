'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useLocale } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { resolveDateFnsLocale } from '@/constants/i18n';

type DateTimePicker24hProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
};

export function DateTimePicker24h({ value, onChange }: DateTimePicker24hProps) {
  const locale = useLocale();
  const dateFnsLocale = React.useMemo(() => resolveDateFnsLocale(locale), [locale]);
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const updateDate = (updater: (prev: Date) => Date) => {
    setDate((prev) => {
      const next = updater(prev ?? new Date());
      onChange?.(next);
      return next;
    });
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      updateDate((prev) => {
        const base = prev ?? selectedDate;
        const next = new Date(selectedDate);
        next.setHours(base.getHours(), base.getMinutes(), base.getSeconds(), base.getMilliseconds());
        return next;
      });
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
    updateDate((prev) => {
      const next = new Date(prev ?? new Date());
      if (type === 'hour') {
        next.setHours(parseInt(value, 10));
      } else if (type === 'minute') {
        next.setMinutes(parseInt(value, 10));
      }
      return next;
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {date ? (
            new Intl.DateTimeFormat(locale, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }).format(date)
          ) : (
            <span>dd-MM-yyyy HH:mm</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <div className='sm:flex'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            locale={dateFnsLocale}
          />
          <div className='flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0'>
            <ScrollArea className='w-64 sm:w-auto'>
              <div className='flex p-2 sm:flex-col'>
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    size='icon'
                    variant={date && date.getHours() === hour ? 'default' : 'ghost'}
                    className='aspect-square shrink-0 sm:w-full'
                    onClick={() => handleTimeChange('hour', hour.toString())}
                  >
                    {hour.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation='horizontal' className='sm:hidden' />
            </ScrollArea>
            <ScrollArea className='w-64 sm:w-auto'>
              <div className='flex p-2 sm:flex-col'>
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    size='icon'
                    variant={date && date.getMinutes() === minute ? 'default' : 'ghost'}
                    className='aspect-square shrink-0 sm:w-full'
                    onClick={() => handleTimeChange('minute', minute.toString())}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation='horizontal' className='sm:hidden' />
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
DateTimePicker24h.displayName = 'DateTimePicker24h';
