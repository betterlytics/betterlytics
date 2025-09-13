'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon, FilterIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '@/components/ui/button';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { QueryFilterInputRow } from './QueryFilterInputRow';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { Separator } from '../ui/separator';
import { isQueryFiltersEqual } from '@/utils/queryFilters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslations } from 'next-intl';

export default function QueryFiltersSelector() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isMobile = useIsMobile();
  const t = useTranslations('components.filters');

  const { queryFilters: contextQueryFilters, setQueryFilters } = useQueryFiltersContext();
  const {
    queryFilters,
    setQueryFilters: setLocalQueryFilters,
    addEmptyQueryFilter,
    removeQueryFilter,
    updateQueryFilter,
  } = useQueryFilters();

  useEffect(() => {
    setLocalQueryFilters(contextQueryFilters);
  }, [contextQueryFilters]);

  const saveFilters = useCallback(() => {
    setQueryFilters(queryFilters);
    setIsPopoverOpen(false);
  }, [queryFilters]);

  const cancelFilters = useCallback(() => {
    setLocalQueryFilters(contextQueryFilters);
    setIsPopoverOpen(false);
  }, [contextQueryFilters]);

  const isFiltersModified = useMemo(() => {
    return (
      contextQueryFilters.length !== queryFilters.length ||
      queryFilters.some((filter, index) => {
        const ctxFilter = contextQueryFilters[index];
        return isQueryFiltersEqual(ctxFilter, filter) === false;
      })
    );
  }, [contextQueryFilters, queryFilters]);

  const content = (
    <>
      {queryFilters.length > 0 || isFiltersModified ? (
        <div className='space-y-2'>
          <div className='space-y-3'>
            {queryFilters.map((filter) => (
              <QueryFilterInputRow
                key={filter.id}
                onFilterUpdate={updateQueryFilter}
                filter={filter}
                requestRemoval={(_filter) => removeQueryFilter(_filter.id)}
              />
            ))}
            {queryFilters.length === 0 && (
              <div className='text-muted-foreground flex h-9 items-center gap-2'>
                {t('selector.emptyNoneSelected')}
              </div>
            )}
          </div>
          <Separator />
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <Button className='h-8 w-full cursor-pointer md:w-28' onClick={addEmptyQueryFilter} variant='outline'>
              {t('selector.addFilter')}
            </Button>
            <div className='flex w-full justify-between gap-2 md:w-auto md:justify-end md:gap-3'>
              <Button
                className='h-8 w-[48%] max-w-[110px] cursor-pointer'
                disabled={!isFiltersModified}
                onClick={cancelFilters}
                variant={'ghost'}
              >
                {t('selector.cancel')}
              </Button>
              <Button
                className='h-8 w-[48%] max-w-[110px] cursor-pointer'
                disabled={isFiltersModified === false}
                onClick={saveFilters}
                variant={isFiltersModified ? 'default' : 'ghost'}
              >
                {t('selector.apply')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className='space-y-2'>
          <div className='space-y-3'>
            <QueryFilterInputRow
              key={'new'}
              onFilterUpdate={updateQueryFilter}
              filter={addEmptyQueryFilter() as any}
              requestRemoval={(filter) => removeQueryFilter(filter.id)}
            />
          </div>
          <Separator />
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <Button className='h-8 w-full cursor-pointer md:w-28' onClick={addEmptyQueryFilter} variant='outline'>
              {t('selector.addFilter')}
            </Button>
            <div className='flex w-full justify-between gap-2 md:w-auto md:justify-end md:gap-3'>
              <Button className='h-8 w-[48%] max-w-[110px] cursor-pointer' onClick={cancelFilters} variant='ghost'>
                {t('selector.cancel')}
              </Button>
              <Button className='h-8 w-[48%] max-w-[110px] cursor-pointer' onClick={saveFilters}>
                {t('selector.apply')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Dialog open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <DialogTrigger asChild>
          <Button
            variant='secondary'
            role='combobox'
            className={
              'dark:bg-secondary bg-popover min-w-[200px] cursor-pointer justify-between border shadow-sm'
            }
          >
            <div className='flex items-center gap-2'>
              <FilterIcon className='h-4 w-4' />
              <span>{t('selector.triggerLabel')}</span>
            </div>
            <ChevronDownIcon className={`ml-2 h-4 w-4 shrink-0 opacity-50`} />
          </Button>
        </DialogTrigger>
        <DialogContent className='bg-popover max-h-[85vh] w-[calc(100vw-2rem)] max-w-[640px] overflow-y-auto px-2 py-3'>
          <DialogHeader>
            <DialogTitle>{t('selector.title')}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='secondary'
          role='combobox'
          className={'dark:bg-secondary bg-popover min-w-[200px] cursor-pointer justify-between border shadow-sm'}
        >
          <div className='flex items-center gap-2'>
            <FilterIcon className='h-4 w-4' />
            <span>{t('selector.triggerLabel')}</span>
          </div>
          <ChevronDownIcon className={`ml-2 h-4 w-4 shrink-0 opacity-50`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[620px] max-w-[calc(100svw-48px)] border py-4 shadow-2xl' align='start'>
        {content}
      </PopoverContent>
    </Popover>
  );
}
