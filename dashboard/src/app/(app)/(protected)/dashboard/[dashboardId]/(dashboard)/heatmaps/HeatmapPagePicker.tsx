'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, FileText, TriangleAlert } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FrameMenuButton } from './HeatmapFrame';
import type { HeatmapPageOption } from './heatmapSelection';

const MAX_VISIBLE_PAGES = 50;

type HeatmapPagePickerProps = {
  pages: HeatmapPageOption[];
  /** Whether the list stops at its limit, so less visited pages are left out */
  truncated: boolean;
  value: string | undefined;
  onValueChange: (url: string) => void;
};

export function HeatmapPagePicker({ pages, truncated, value, onValueChange }: HeatmapPagePickerProps) {
  const t = useTranslations('components.heatmaps');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? pages.filter((page) => page.url.toLowerCase().includes(query)) : pages;
  }, [pages, search]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch('');
  };

  const select = (url: string) => {
    handleOpenChange(false);
    if (url !== value) onValueChange(url);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <FrameMenuButton
          icon={<FileText className='size-3.5' />}
          label={value ?? t('pagePicker')}
          role='combobox'
          aria-expanded={open}
          aria-label={t('pagePicker')}
          disabled={value === undefined}
        />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-[min(24rem,calc(100vw-2rem))] p-0'>
        <Command shouldFilter={false}>
          <CommandInput placeholder={t('pageSearch')} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{t('pageSearchEmpty')}</CommandEmpty>
            <CommandGroup>
              {matches.slice(0, MAX_VISIBLE_PAGES).map((page) => (
                <CommandItem
                  key={page.url}
                  value={page.url}
                  onSelect={() => select(page.url)}
                  className='cursor-pointer'
                >
                  <Check className={cn('h-4 w-4 shrink-0', page.url === value ? 'opacity-100' : 'opacity-0')} />
                  <span className='min-w-0 flex-1 truncate'>{page.url}</span>
                  {page.devices?.length === 0 && <NoDataWarning label={t('pageNoData')} />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {matches.length > MAX_VISIBLE_PAGES && (
            <p className='text-muted-foreground border-t px-3 py-2 text-xs'>
              {t(truncated ? 'pagesTruncatedAtLimit' : 'pagesTruncated', {
                shown: MAX_VISIBLE_PAGES,
                total: matches.length,
              })}
            </p>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function NoDataWarning({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span role='img' aria-label={label} className='shrink-0 text-amber-500'>
          <TriangleAlert className='size-3.5' />
        </span>
      </TooltipTrigger>
      <TooltipContent side='right' className='max-w-xs'>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
