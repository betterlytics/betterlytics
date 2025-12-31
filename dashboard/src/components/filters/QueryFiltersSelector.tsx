'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon, FilterIcon, SaveIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { QueryFilterInputRow } from './QueryFilterInputRow';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { Separator } from '@/components/ui/separator';
import { filterEmptyQueryFilters, isQueryFiltersEqual } from '@/utils/queryFilters';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslations } from 'next-intl';
import { DisabledDemoTooltip } from '@/components/tooltip/DisabledDemoTooltip';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { SaveQueryFilterDialog } from './SaveQueryFilterDialog';
import { SavedFiltersSection } from './SavedFiltersSection';
import { useSavedFiltersLimitReached } from '@/hooks/use-saved-filters';

export default function QueryFiltersSelector() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavedFiltersOpen, setIsSavedFiltersOpen] = useState(false);
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

  const applyFilters = useCallback(() => {
    setQueryFilters(filterEmptyQueryFilters(queryFilters));
    setIsPopoverOpen(false);
  }, [queryFilters, setQueryFilters]);

  const cancelFilters = useCallback(() => {
    setLocalQueryFilters(contextQueryFilters);
    setIsPopoverOpen(false);
  }, [contextQueryFilters, setLocalQueryFilters]);

  const handleLoadSavedFilter = useCallback(
    (filters: QueryFilter[]) => {
      setQueryFilters(filters);
      setLocalQueryFilters(filters);
      setIsPopoverOpen(false);
    },
    [setQueryFilters, setLocalQueryFilters],
  );

  const isFiltersModified = useMemo(() => {
    const filteredQueryFilters = filterEmptyQueryFilters(queryFilters);
    const filteredContextQueryFilters = filterEmptyQueryFilters(contextQueryFilters);
    return (
      filteredQueryFilters.length !== filteredContextQueryFilters.length ||
      filteredQueryFilters.some((filter, index) => {
        const ctxFilter = filteredContextQueryFilters[index];
        return isQueryFiltersEqual(ctxFilter, filter) === false;
      })
    );
  }, [contextQueryFilters, queryFilters]);

  const hasValidFilters = useMemo(() => {
    return filterEmptyQueryFilters(queryFilters).length > 0;
  }, [queryFilters]);

  const { data: isSavedFiltersLimitReached } = useSavedFiltersLimitReached();

  const content = (
    <>
      {queryFilters.length > 0 || isFiltersModified ? (
        <div className='space-y-2'>
          <div className='space-y-1'>
            {queryFilters.map((filter) => (
              <QueryFilterInputRow
                key={filter.id}
                onFilterUpdate={updateQueryFilter}
                filter={filter}
                requestRemoval={(_filter) => removeQueryFilter(_filter.id)}
              />
            ))}
            {queryFilters.length === 0 && (
              <div className='text-muted-foreground flex h-9 items-center justify-center gap-2 text-sm'>
                {t('selector.emptyNoneSelected')}
              </div>
            )}
          </div>
          <Separator />
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <DisabledDemoTooltip disabled={queryFilters.length >= 1}>
              {(isDisabled) => (
                <Button
                  className='h-8 w-full cursor-pointer md:w-28'
                  onClick={() => {
                    if (isDisabled) return;
                    addEmptyQueryFilter();
                  }}
                  variant='outline'
                  disabled={isDisabled}
                >
                  {t('selector.addFilter')}
                </Button>
              )}
            </DisabledDemoTooltip>
            <div className='flex w-full justify-between gap-2 md:w-auto md:justify-end md:gap-2'>
              <DisabledDemoTooltip>
                {(isDemo) => (
                  <DisabledTooltip
                    disabled={Boolean(!isDemo && isSavedFiltersLimitReached)}
                    message={t('selector.savedFiltersLimitReached')}
                  >
                    {(isLimitDisabled) => (
                      <Button
                        className='h-8 cursor-pointer'
                        variant='ghost'
                        onClick={() => setIsSaveDialogOpen(true)}
                        disabled={isDemo || !hasValidFilters || isLimitDisabled}
                      >
                        <SaveIcon className='h-4 w-4' />
                      </Button>
                    )}
                  </DisabledTooltip>
                )}
              </DisabledDemoTooltip>
              <Button
                className='h-8 w-[48%] max-w-[110px] cursor-pointer md:w-auto'
                disabled={!isFiltersModified}
                onClick={cancelFilters}
                variant={'ghost'}
              >
                {t('selector.cancel')}
              </Button>
              <Button
                className='h-8 w-[48%] max-w-[110px] cursor-pointer md:w-auto'
                disabled={isFiltersModified === false}
                onClick={applyFilters}
                variant={isFiltersModified ? 'default' : 'ghost'}
              >
                {t('selector.apply')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className='space-y-2'>
          <div className='space-y-1'>
            <QueryFilterInputRow
              key={'new'}
              onFilterUpdate={updateQueryFilter}
              filter={addEmptyQueryFilter() as any}
              requestRemoval={(filter) => removeQueryFilter(filter.id)}
            />
          </div>
          <Separator />
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <DisabledDemoTooltip disabled={queryFilters.length >= 1}>
              {(isDisabled) => (
                <Button
                  className='h-8 w-full cursor-pointer md:w-28'
                  onClick={() => {
                    if (isDisabled) return;
                    addEmptyQueryFilter();
                  }}
                  variant='outline'
                  disabled={isDisabled}
                >
                  {t('selector.addFilter')}
                </Button>
              )}
            </DisabledDemoTooltip>
            <div className='flex w-full justify-between gap-2 md:w-auto md:justify-end md:gap-3'>
              <Button className='h-8 w-[48%] max-w-[110px] cursor-pointer' onClick={cancelFilters} variant='ghost'>
                {t('selector.cancel')}
              </Button>
              <Button className='h-8 w-[48%] max-w-[110px] cursor-pointer' onClick={applyFilters}>
                {t('selector.apply')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <SavedFiltersSection
        onLoadFilter={handleLoadSavedFilter}
        isOpen={isSavedFiltersOpen}
        onOpenChange={setIsSavedFiltersOpen}
      />

      <SaveQueryFilterDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen} filters={queryFilters} />
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
              'border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent min-w-[200px] cursor-pointer justify-between border bg-transparent shadow-xs transition-[color,box-shadow]'
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
          <div className='space-y-1'>{content}</div>
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
          className={
            'border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent min-w-[200px] cursor-pointer justify-between border bg-transparent shadow-xs transition-[color,box-shadow]'
          }
        >
          <div className='flex items-center gap-2'>
            <FilterIcon className='h-4 w-4' />
            <span>{t('selector.triggerLabel')}</span>
          </div>
          <ChevronDownIcon className={`ml-2 h-4 w-4 shrink-0 opacity-50`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[620px] max-w-[calc(100svw-48px)] border p-3 shadow-2xl' align='start'>
        {content}
      </PopoverContent>
    </Popover>
  );
}
