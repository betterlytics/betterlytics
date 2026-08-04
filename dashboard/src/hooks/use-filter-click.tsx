'use client';

import { useCallback, useEffect } from 'react';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import {
  applyFilterUpdates,
  areQueryFiltersEquivalent,
  diffQueryFilters,
  MAX_FILTER_ROWS,
  withDependentColumns,
  withStableIds,
  type FilterColumn,
  type FilterOperator,
  type FilterUpdate,
  type QueryFilter,
} from '@/entities/analytics/filter.entities';
import { toast } from 'sonner';
import { NextIntlClientProvider, useLocale, useMessages, useTranslations } from 'next-intl';
import { useFilterColumnStatus } from '@/hooks/use-is-filter-column-allowed';
import { FiltersUpdatedToast } from '@/components/filters/FiltersUpdatedToast';
import { generateTempId } from '@/utils/temporaryId';

const FILTER_TOAST_ID = 'filters-updated';
const FILTER_TOAST_DURATION_MS = 10000;

/* The toast's Undo targets the query-filter state of the shell that hosts
   click-to-filter, so that shell dismisses the toast when it unmounts. */
export function useDismissFilterToastOnUnmount() {
  useEffect(() => {
    return () => {
      toast.dismiss(FILTER_TOAST_ID);
    };
  }, []);
}

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
  const locale = useLocale();
  const messages = useMessages();

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
      toast(
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FiltersUpdatedToast added={added} removed={removed} />
        </NextIntlClientProvider>,
        {
          id: FILTER_TOAST_ID,
          duration: FILTER_TOAST_DURATION_MS,
          action: {
            label: tFilters('selector.toastUndo'),
            onClick: () => setQueryFilters((fs) => withStableIds(prev, fs)),
          },
        },
      );
    },
    [locale, messages, tFilters, setQueryFilters],
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
        setQueryFilters((fs) => applyFilterUpdates(fs, [{ column, value, operator }], replaced));
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
      setQueryFilters((fs) => applyFilterUpdates(fs, applied, replaced));
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
