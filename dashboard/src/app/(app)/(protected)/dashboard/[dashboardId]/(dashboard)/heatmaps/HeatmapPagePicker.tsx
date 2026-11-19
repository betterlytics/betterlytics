'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { HeatmapPageRow } from '@/entities/analytics/clickHeatmap.entities';

type HeatmapPagePickerProps = {
  pages: HeatmapPageRow[];
  value: string;
  onValueChange: (url: string) => void;
};

export function HeatmapPagePicker({ pages, value, onValueChange }: HeatmapPagePickerProps) {
  const t = useTranslations('components.heatmaps');
  const [open, setOpen] = useState(false);

  const select = (url: string) => {
    setOpen(false);
    if (url !== value) onValueChange(url);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-label={t('pagePicker')}
          className='w-full cursor-pointer justify-between font-normal sm:w-96'
        >
          <span className='truncate'>{value}</span>
          <ChevronDown className='h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-[var(--radix-popover-trigger-width)] min-w-72 p-0'>
        <Command>
          <CommandInput placeholder={t('pageSearch')} />
          <CommandList>
            <CommandEmpty>{t('pageSearchEmpty')}</CommandEmpty>
            <CommandGroup>
              {pages.map((page) => (
                <CommandItem
                  key={page.url}
                  value={page.url}
                  onSelect={() => select(page.url)}
                  className='cursor-pointer'
                >
                  <Check className={cn('h-4 w-4 shrink-0', page.url === value ? 'opacity-100' : 'opacity-0')} />
                  <span className='min-w-0 flex-1 truncate'>{page.url}</span>
                  <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                    {t('clicks', { count: page.clicks })}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
