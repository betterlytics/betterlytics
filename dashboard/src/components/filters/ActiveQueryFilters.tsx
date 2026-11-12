'use client';
import { useRef, type MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { FilterBand } from '@/components/filters/FilterBand';
import { FilterPill } from '@/components/filters/FilterPill';
import { useNotifyFiltersUpdated } from '@/components/filters/filtersUpdatedToast';

type ActiveQueryFiltersProps = {
  // 'band' is the pinned one-row version under the topbar
  variant?: 'row' | 'band';
};

export function ActiveQueryFilters({ variant = 'row' }: ActiveQueryFiltersProps) {
  const { queryFilters, removeQueryFilter, setQueryFilters } = useQueryFiltersContext();
  const t = useTranslations('components.filters');
  const notifyFiltersUpdated = useNotifyFiltersUpdated();
  const band = variant === 'band';

  // Pills present on first render (e.g. from the URL) must not replay the entrance pulse.
  const initialIdsRef = useRef<Set<string> | null>(null);
  const initialIds = (initialIdsRef.current ??= new Set(queryFilters.map((filter) => filter.id)));

  if (queryFilters.length === 0) {
    return null;
  }

  // Keeps focus off <body> once the pills unmount
  const focusFiltersTrigger = (from: HTMLElement) =>
    from
      .closest('[data-slot=dashboard-filters]')
      ?.querySelector<HTMLElement>('[data-query-filters-trigger]')
      ?.focus({ preventScroll: true });

  const clearAll = (event: MouseEvent<HTMLElement>) => {
    focusFiltersTrigger(event.currentTarget);
    setQueryFilters([]);
    notifyFiltersUpdated(queryFilters, []);
  };

  const pills = queryFilters.map((filter) => (
    <FilterPill
      key={filter.id}
      filter={filter}
      variant={variant}
      isNew={!initialIds.has(filter.id)}
      onRemove={(event) => {
        if (queryFilters.length === 1) focusFiltersTrigger(event.currentTarget);
        removeQueryFilter(filter.id);
      }}
    />
  ));

  if (!band) {
    return <div className='flex flex-wrap gap-1 sm:justify-end'>{pills}</div>;
  }

  return <FilterBand pills={pills} pillsKey={queryFilters} label={t('activeFilters')} onClearAll={clearAll} />;
}
