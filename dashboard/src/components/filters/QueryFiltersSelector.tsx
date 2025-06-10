import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon, FilterIcon, PlusIcon, SettingsIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { QueryFilterInputRow } from './QueryFilterInputRow';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { Separator } from '../ui/separator';
import { isQueryFiltersEqual } from '@/utils/queryFilters';

export default function QueryFiltersSelector() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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
      <PopoverContent className='w-[620px] max-w-[90svw] border py-4 shadow-2xl' align='end'>
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
            <div className='flex justify-between'>
              <Button className='h-8 w-28' onClick={addEmptyQueryFilter} variant='outline'>
                Add filter
              </Button>
              <div className='flex items-center justify-end gap-3'>
                <Button
                  className='h-8 w-28'
                  disabled={isFiltersModified === false}
                  onClick={cancelFilters}
                  variant={isFiltersModified ? 'destructive' : 'ghost'}
                >
                  Cancel
                </Button>
                <Button
                  className='h-8 w-28'
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
          <div className='flex flex-col items-center justify-center px-4 py-4 pb-8 text-center'>
            <div className='bg-muted mb-4 rounded-full p-3'>
              <FilterIcon className='text-muted-foreground h-6 w-6' />
            </div>
            <h3 className='mb-1 text-base font-medium'>No active filters</h3>
            <p className='text-muted-foreground mb-4 max-w-[260px] text-sm'>
              Add filters to refine your analytics data and focus on specific segments.
            </p>
            <div className='flex w-full flex-col gap-2'>
              <Button className='w-full' size='sm' onClick={addEmptyQueryFilter}>
                <PlusIcon className='mr-2 h-4 w-4' />
                Add your first filter
              </Button>
              <div className='text-muted-foreground mt-2 flex items-center gap-2 text-xs'>
                <SettingsIcon className='h-3 w-3' />
                <span>Common filters: Country, Browser, URL, Device</span>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
