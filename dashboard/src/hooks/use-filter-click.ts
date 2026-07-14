'use client';

import { useCallback } from 'react';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { MAX_FILTER_ROWS, type FilterColumn, type FilterOperator } from '@/entities/analytics/filter.entities';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useFilterColumnStatus } from '@/hooks/use-is-filter-column-allowed';

type Behavior = 'append' | 'replace-same-column' | 'toggle';

type Options = {
  operator?: FilterOperator;
  behavior?: Behavior;
};

export function useFilterClick(defaults?: Options) {
  const { queryFilters, addQueryFilter, removeQueryFilter, setQueryFilters } = useQueryFiltersContext();
  const getColumnStatus = useFilterColumnStatus();
  const t = useTranslations('components.demoMode');
  const tFilters = useTranslations('components.filters');

  const defaultOperator: FilterOperator = defaults?.operator ?? '=';
  const defaultBehavior: Behavior = defaults?.behavior ?? 'replace-same-column';

  const notifyCapReached = useCallback(
    () => toast.warning(tFilters('selector.maxFiltersReachedToast', { max: MAX_FILTER_ROWS })),
    [tFilters],
  );

  const applyFilter = useCallback(
    (column: FilterColumn, value: string, opts?: Options) => {
      const status = getColumnStatus(column);
      if (status.disabled) {
        if (status.reason === 'demo') toast.info(t('interactionDisabled'));
        else if (status.reason === 'page') toast.info(tFilters('notAvailableOnPage'));
        return;
      }

      const operator: FilterOperator = (opts?.operator ?? defaultOperator) as FilterOperator;
      const behavior: Behavior = (opts?.behavior ?? defaultBehavior) as Behavior;

      const atCap = queryFilters.length >= MAX_FILTER_ROWS;

      if (behavior === 'toggle') {
        const existing = queryFilters.find(
          (f) => f.column === column && f.operator === operator && f.values[0] === value,
        );
        if (existing) {
          removeQueryFilter(existing.id);
          return;
        }
        if (atCap) {
          notifyCapReached();
          return;
        }
        addQueryFilter({ column, operator, values: [value] });
        return;
      }

      if (behavior === 'replace-same-column') {
        // Replacing an existing column keeps the count the same, so only a brand-new column is capped.
        const replacesExistingColumn = queryFilters.some((f) => f.column === column);
        if (atCap && !replacesExistingColumn) {
          notifyCapReached();
          return;
        }
        setQueryFilters((fs) => fs.filter((f) => f.column !== column));
        addQueryFilter({ column, operator, values: [value] });
        return;
      }

      if (atCap) {
        notifyCapReached();
        return;
      }
      addQueryFilter({ column, operator, values: [value] });
    },
    [
      addQueryFilter,
      removeQueryFilter,
      setQueryFilters,
      queryFilters,
      defaultOperator,
      defaultBehavior,
      getColumnStatus,
      t,
      tFilters,
      notifyCapReached,
    ],
  );

  const makeFilterClick = useCallback(
    (column: FilterColumn, opts?: Options) => (value: string) => applyFilter(column, value, opts),
    [applyFilter],
  );

  return { applyFilter, makeFilterClick };
}
