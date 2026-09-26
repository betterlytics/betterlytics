'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { getSupportedTimezones } from '@/utils/timezone';
import { cn } from '@/lib/utils';

const AUTO_VALUE = '__auto__';

type TimezoneSelectProps = {
  value: string | null;
  detected: string | null;
  onUpdate: (timezone: string | null) => void;
  id?: string;
};

export function TimezoneSelect({ value, detected, onUpdate, id }: TimezoneSelectProps) {
  const t = useTranslations('components.userSettings.preferences.localization');
  const [open, setOpen] = useState(false);
  const zones = useMemo(() => getSupportedTimezones(), []);
  const autoLabel = detected ? t('timezoneAuto', { zone: detected }) : t('timezoneAutoUnavailable');

  const select = (timezone: string | null) => {
    onUpdate(timezone);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-56 cursor-pointer justify-between font-normal'
        >
          <span className='truncate'>{value ?? autoLabel}</span>
          <ChevronDown className='h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-64 p-0'>
        <Command>
          <CommandInput placeholder={t('timezoneSearch')} />
          <CommandList>
            <CommandEmpty>{t('timezoneEmpty')}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={AUTO_VALUE}
                keywords={[autoLabel]}
                onSelect={() => select(null)}
                className='cursor-pointer'
              >
                <Check className={cn(value === null ? 'opacity-100' : 'opacity-0')} />
                {autoLabel}
              </CommandItem>
              {zones.map((zone) => (
                <CommandItem key={zone} value={zone} onSelect={() => select(zone)} className='cursor-pointer'>
                  <Check className={cn(value === zone ? 'opacity-100' : 'opacity-0')} />
                  {zone}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
