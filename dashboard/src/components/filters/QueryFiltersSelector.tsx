import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon, FilterIcon, PlusIcon, SettingsIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { QueryFilterInputRow } from './QueryFilterInputRow';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { Separator } from '../ui/separator';
import { isQueryFiltersEqual } from '@/utils/queryFilters';
import { useIsMobile } from '@/hooks/use-mobile';

export default function QueryFiltersSelector() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isMobile = useIsMobile();

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
                No filters selected - apply to save
              </div>
            )}
          </div>
          <Separator />
          <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
            <Button className='h-8 w-full md:w-28' onClick={addEmptyQueryFilter} variant='outline'>
              Add filter
            </Button>
            <div className='flex w-full justify-between gap-2 md:w-auto md:justify-end md:gap-3'>
              <Button
                className='h-8 w-[48%] max-w-[110px]'
                disabled={!isFiltersModified}
                onClick={cancelFilters}
                variant={isFiltersModified ? 'destructive' : 'ghost'}
              >
                Cancel
              </Button>
              <Button
                className='h-8 w-[48%] max-w-[110px]'
                disabled={isFiltersModified === false}
                onClick={saveFilters}
                variant={isFiltersModified ? 'default' : 'ghost'}
              >
                Apply
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
            <Button className='h-8 w-full md:w-28' onClick={addEmptyQueryFilter} variant='outline'>
              Add filter
            </Button>
            <div className='flex w-full justify-between gap-2 md:w-auto md:justify-end md:gap-3'>
              <Button className='h-8 w-[48%] max-w-[110px]' onClick={cancelFilters} variant='ghost'>
                Cancel
              </Button>
              <Button className='h-8 w-[48%] max-w-[110px]' onClick={saveFilters}>
                Apply
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
          <Button variant='outline' role='combobox' className={'min-w-[200px] justify-between shadow-sm'}>
            <div className='flex items-center gap-2'>
              <FilterIcon className='h-4 w-4' />
              <span>Filters</span>
            </div>
            <ChevronDownIcon className={`ml-2 h-4 w-4 shrink-0 opacity-50`} />
          </Button>
        </DialogTrigger>
        <DialogContent className='top-[40%] max-h-[85vh] w-[calc(100vw-2rem)] max-w-[640px] overflow-y-auto p-4'>
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' className={'min-w-[200px] justify-between shadow-sm'}>
          <div className='flex items-center gap-2'>
            <FilterIcon className='h-4 w-4' />
            <span>Filters</span>
          </div>
          <ChevronDownIcon className={`ml-2 h-4 w-4 shrink-0 opacity-50`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[620px] max-w-[calc(100svw-48px)] border py-4 shadow-2xl' align='end'>
        {content}
      </PopoverContent>
    </Popover>
  );
}
