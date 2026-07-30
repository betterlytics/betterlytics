'use client';

import { useCallback, type ReactNode } from 'react';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import {
  applyFilterUpdates,
  MAX_FILTER_ROWS,
  withDependentColumns,
  type FilterColumn,
  type FilterOperator,
  type FilterUpdate,
  type QueryFilter,
} from '@/entities/analytics/filter.entities';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useFilterColumnStatus } from '@/hooks/use-is-filter-column-allowed';

const FILTER_APPLIED_TOAST_ID = 'filter-applied';
const FILTER_APPLIED_TOAST_DURATION_MS = 6000;

type Behavior = 'append' | 'replace-same-column' | 'toggle';

type Options = {
  operator?: FilterOperator;
  behavior?: Behavior;
};

type ApplyOptions = Options & { label?: ReactNode };

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

  const notifyFilterApplied = useCallback(
    (label: ReactNode, snapshot: QueryFilter[]) =>
      toast(tFilters.rich('toastFilterApplied', { label: () => label }), {
        id: FILTER_APPLIED_TOAST_ID,
        duration: FILTER_APPLIED_TOAST_DURATION_MS,
        action: {
          label: tFilters('selector.toastUndo'),
          onClick: () => setQueryFilters(snapshot),
        },
      }),
    [tFilters, setQueryFilters],
  );

  const applyFilter = useCallback(
    (column: FilterColumn, value: string, opts?: ApplyOptions) => {
      const status = getColumnStatus(column);
      if (status.disabled) {
        if (status.reason === 'demo') toast.info(t('interactionDisabled'));
        else if (status.reason === 'page') toast.info(tFilters('notAvailableOnPage'));
        return;
      }

      const operator: FilterOperator = (opts?.operator ?? defaultOperator) as FilterOperator;
      const behavior: Behavior = (opts?.behavior ?? defaultBehavior) as Behavior;
      const label = opts?.label ?? value;

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
        notifyFilterApplied(label, queryFilters);
        return;
      }

      if (behavior === 'replace-same-column') {
        const replaced = withDependentColumns([column]);
        const next = applyFilterUpdates(queryFilters, [{ column, value, operator }], replaced);
        if (next.length > MAX_FILTER_ROWS) {
          notifyCapReached();
          return;
        }
        setQueryFilters((fs) => applyFilterUpdates(fs, [{ column, value, operator }], replaced));
        notifyFilterApplied(label, queryFilters);
        return;
      }

      if (atCap) {
        notifyCapReached();
        return;
      }
      addQueryFilter({ column, operator, values: [value] });
      notifyFilterApplied(label, queryFilters);
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
      notifyFilterApplied,
    ],
  );

  const applyFilters = useCallback(
    (updates: FilterUpdate[], label?: ReactNode) => {
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
      if (next.length > MAX_FILTER_ROWS) {
        notifyCapReached();
        return;
      }
      setQueryFilters((fs) => applyFilterUpdates(fs, applied, replaced));
      notifyFilterApplied(label ?? updates.map((update) => update.value).join(', '), queryFilters);
    },
    [getColumnStatus, queryFilters, setQueryFilters, defaultOperator, t, tFilters, notifyCapReached, notifyFilterApplied],
  );

  const makeFilterClick = useCallback(
    (column: FilterColumn, opts?: Options) =>
      (value: string, label?: ReactNode) =>
        applyFilter(column, value, { ...opts, label }),
    [applyFilter],
  );

  return { applyFilter, applyFilters, makeFilterClick };
}
