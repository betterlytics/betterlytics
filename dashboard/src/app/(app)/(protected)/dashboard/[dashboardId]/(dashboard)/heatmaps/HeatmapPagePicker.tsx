'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, TriangleAlert } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui-extended/scroll-area';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';
import { FrameMenuButton } from './HeatmapFrame';
import type { HeatmapPageOption } from './heatmapSelection';

const PAGE_BATCH = 50;

type HeatmapPagePickerProps = {
  pages: HeatmapPageOption[];
  value: string | undefined;
  onValueChange: (url: string) => void;
};

export function HeatmapPagePicker({ pages, value, onValueChange }: HeatmapPagePickerProps) {
  const t = useTranslations('components.heatmaps');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_BATCH);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const { ref: endRef, inView: endInView } = useInView<HTMLDivElement>({ root: viewport, rootMargin: '200px' });

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? pages.filter((page) => page.url.toLowerCase().includes(query)) : pages;
  }, [pages, search]);
  const hasMore = matches.length > visibleCount;

  useEffect(() => {
    if (endInView && hasMore) setVisibleCount((count) => count + PAGE_BATCH);
  }, [endInView, hasMore]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearch('');
      setVisibleCount(PAGE_BATCH);
    }
  };

  const handleSearchChange = (next: string) => {
    setSearch(next);
    setVisibleCount(PAGE_BATCH);
  };

  const select = (url: string) => {
    handleOpenChange(false);
    if (url !== value) onValueChange(url);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <FrameMenuButton
          label={value ?? t('pagePicker')}
          role='combobox'
          aria-expanded={open}
          aria-label={t('pagePicker')}
          disabled={value === undefined}
        />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-[min(24rem,calc(100vw-2rem))] p-0'>
        <Command shouldFilter={false}>
          <CommandInput placeholder={t('pageSearch')} value={search} onValueChange={handleSearchChange} />
          <ScrollArea viewportRef={setViewport} viewportClassName='max-h-[300px] [&>div]:!block'>
            <CommandList className='max-h-none overflow-visible'>
              <CommandEmpty>{t('pageSearchEmpty')}</CommandEmpty>
              <CommandGroup>
                {matches.slice(0, visibleCount).map((page) => (
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
              {hasMore && <div ref={endRef} aria-hidden className='h-px' />}
            </CommandList>
          </ScrollArea>
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
