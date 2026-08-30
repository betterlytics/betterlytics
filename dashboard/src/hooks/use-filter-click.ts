'use client';

import { useCallback } from 'react';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import {
  applyFilterUpdates,
  areQueryFiltersEquivalent,
  diffQueryFilters,
  MAX_FILTER_ROWS,
  undoQueryFilterDiff,
  withDependentColumns,
  type FilterColumn,
  type FilterOperator,
  type FilterUpdate,
  type QueryFilter,
} from '@/entities/analytics/filter.entities';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useFilterColumnStatus } from '@/hooks/use-is-filter-column-allowed';
import { showFiltersUpdatedToast } from '@/components/filters/filtersUpdatedToast';
import { generateTempId } from '@/utils/temporaryId';

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

  const notifyFiltersUpdated = useCallback(
    (prev: QueryFilter[], next: QueryFilter[]) => {
      const { added, removed } = diffQueryFilters(prev, next);
      if (added.length === 0 && removed.length === 0) return;
      showFiltersUpdatedToast({
        added,
        removed,
        onUndo: () => setQueryFilters((fs) => undoQueryFilterDiff(fs, { added, removed })),
      });
    },
    [setQueryFilters],
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
          notifyFiltersUpdated(queryFilters, queryFilters.filter((f) => f.id !== existing.id));
          return;
        }
        if (atCap) {
          notifyCapReached();
          return;
        }
        const filter = { id: generateTempId(), column, operator, values: [value] };
        addQueryFilter(filter);
        notifyFiltersUpdated(queryFilters, [...queryFilters, filter]);
        return;
      }

      if (behavior === 'replace-same-column') {
        const replaced = withDependentColumns([column]);
        const next = applyFilterUpdates(queryFilters, [{ column, value, operator }], replaced);
        if (areQueryFiltersEquivalent(queryFilters, next)) return;
        if (next.length > MAX_FILTER_ROWS) {
          notifyCapReached();
          return;
        }
        setQueryFilters(next);
        notifyFiltersUpdated(queryFilters, next);
        return;
      }

      if (queryFilters.some((f) => f.column === column && f.operator === operator && f.values[0] === value)) {
        return;
      }
      if (atCap) {
        notifyCapReached();
        return;
      }
      const filter = { id: generateTempId(), column, operator, values: [value] };
      addQueryFilter(filter);
      notifyFiltersUpdated(queryFilters, [...queryFilters, filter]);
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
      notifyFiltersUpdated,
    ],
  );

  const applyFilters = useCallback(
    (updates: FilterUpdate[]) => {
      for (const update of updates) {
        const status = getColumnStatus(update.column);
        if (status.disabled) {
          if (status.reason === 'demo') toast.info(t('interactionDisabled'));
          else if (status.reason === 'page') toast.info(tFilters('notAvailableOnPage'));
          return;
        }
      }

      const applied = updates.map((update) => ({ ...update, operator: update.operator ?? defaultOperator }));
      const replaced = withDependentColumns(updates.map((update) => update.column));
      const next = applyFilterUpdates(queryFilters, applied, replaced);
      if (areQueryFiltersEquivalent(queryFilters, next)) return;
      if (next.length > MAX_FILTER_ROWS) {
        notifyCapReached();
        return;
      }
      setQueryFilters(next);
      notifyFiltersUpdated(queryFilters, next);
    },
    [getColumnStatus, queryFilters, setQueryFilters, defaultOperator, t, tFilters, notifyCapReached, notifyFiltersUpdated],
  );

  const makeFilterClick = useCallback(
    (column: FilterColumn, opts?: Options) => (value: string) => applyFilter(column, value, opts),
    [applyFilter],
  );

  return { applyFilter, applyFilters, makeFilterClick };
}
