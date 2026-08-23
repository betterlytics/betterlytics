'use client';

import { useCallback, useMemo } from 'react';
import { ChevronDownIcon, FilterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { filterEmptyQueryFilters } from '@/utils/queryFilters';
import { useTranslations } from 'next-intl';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { baEvent } from '@/lib/ba-event';
import { useAllowedQueryFilters } from '@/hooks/use-is-filter-column-allowed';
import { QueryFiltersOverlay } from '@/components/filters/QueryFiltersOverlay';
import { FilterCountBadge } from '@/components/filters/FilterCountBadge';

export default function QueryFiltersSelector() {
  const t = useTranslations('components.filters');
  const { queryFilters: contextQueryFilters, setQueryFilters } = useQueryFiltersContext();
  const nonEmptyFilters = useMemo(() => filterEmptyQueryFilters(contextQueryFilters), [contextQueryFilters]);

  const applyFilters = useCallback(
    (filters: QueryFilter[]) => {
      baEvent('query-filter-applied');
      setQueryFilters(filters);
    },
    [setQueryFilters],
  );

  const handleLoadSavedFilter = useCallback(
    (filters: QueryFilter[]) => {
      baEvent('saved-query-filter-applied');
      setQueryFilters(filters);
    },
    [setQueryFilters],
  );

  const activeFilterCount = useAllowedQueryFilters(nonEmptyFilters).length;

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
        <span>{t('selector.triggerLabel')}</span>
        <FilterCountBadge count={activeFilterCount} />
      </div>
      <ChevronDownIcon className={'ml-2 h-4 w-4 shrink-0 opacity-50'} />
    </Button>
  );

  return (
    <QueryFiltersOverlay
      committedFilters={contextQueryFilters}
      onApply={applyFilters}
      trigger={trigger}
      title={t('selector.title')}
      onLoadSavedFilter={handleLoadSavedFilter}
    />
  );
}
