'use client';

import { useCallback, useState } from 'react';
import { ChevronDownIcon, FilterIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { filterEmptyQueryFilters } from '@/utils/queryFilters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslations } from 'next-intl';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { baEvent } from '@/lib/ba-event';
import { QueryFiltersSelectorContent } from './QueryFiltersSelectorContent';

export default function QueryFiltersSelector() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isMobile = useIsMobile();
  const t = useTranslations('components.filters');

  const { queryFilters: contextQueryFilters, setQueryFilters } = useQueryFiltersContext();

  const handleApply = useCallback(
    (filters: QueryFilter[]) => {
      baEvent('query-filter-applied');
      setQueryFilters(filters);
      setIsPopoverOpen(false);
    },
    [setQueryFilters],
  );

  const handleCancel = useCallback(() => {
    setIsPopoverOpen(false);
  }, []);

  const activeFilterCount = filterEmptyQueryFilters(contextQueryFilters).length;

  const trigger = (
    <Button
      variant='secondary'
      role='combobox'
      className={
        'border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent min-w-[200px] cursor-pointer justify-between border bg-transparent shadow-xs transition-[color,box-shadow]'
      }
    >
      <div className='flex items-center gap-2'>
        <FilterIcon className='h-4 w-4' />
        <span>
          {t('selector.triggerLabel')}
          {activeFilterCount > 0 && ` (${activeFilterCount})`}
        </span>
      </div>
      <ChevronDownIcon className={`ml-2 h-4 w-4 shrink-0 opacity-50`} />
    </Button>
  );

  if (isMobile) {
    return (
      <Dialog open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className='bg-popover max-h-[85vh] w-[calc(100vw-2rem)] max-w-[640px] overflow-y-auto px-2 py-3'>
          <DialogHeader>
            <DialogTitle>{t('selector.title')}</DialogTitle>
          </DialogHeader>
          <div className='space-y-1'>
            <QueryFiltersSelectorContent
              initialFilters={contextQueryFilters}
              onApply={handleApply}
              onCancel={handleCancel}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className='w-[620px] max-w-[calc(100svw-48px)] border p-3 shadow-2xl' align='start'>
        <QueryFiltersSelectorContent
          initialFilters={contextQueryFilters}
          onApply={handleApply}
          onCancel={handleCancel}
        />
      </PopoverContent>
    </Popover>
  );
}
