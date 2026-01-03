'use client';

import { useCallback } from 'react';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { type FilterColumn, type FilterOperator } from '@/entities/analytics/filter.entities';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';

type Behavior = 'append' | 'replace-same-column' | 'toggle';

type Options = {
  operator?: FilterOperator;
  behavior?: Behavior;
};

export function useFilterClick(defaults?: Options) {
  const { queryFilters, addQueryFilter, removeQueryFilter, setQueryFilters } = useQueryFiltersContext();
  const isDemo = useDashboardAuth().isDemo;
  const t = useTranslations('components.demoMode');

  const defaultOperator: FilterOperator = defaults?.operator ?? '=';
  const defaultBehavior: Behavior = defaults?.behavior ?? 'replace-same-column';

  const applyFilter = useCallback(
    (column: FilterColumn, value: string, opts?: Options) => {
      if (isDemo && column !== 'url' && column !== 'device_type') {
        toast.info(t('interactionDisabled'));
        return;
      }

      const operator: FilterOperator = (opts?.operator ?? defaultOperator) as FilterOperator;
      const behavior: Behavior = (opts?.behavior ?? defaultBehavior) as Behavior;

      if (behavior === 'toggle') {
        const existing = queryFilters.find(
          (f) => f.column === column && f.operator === operator && f.value === value,
        );
        if (existing) {
          removeQueryFilter(existing.id);
          return;
        }
        addQueryFilter({ column, operator, value });
        return;
      }

      if (behavior === 'replace-same-column') {
        setQueryFilters((fs) => fs.filter((f) => f.column !== column));
        addQueryFilter({ column, operator, value });
        return;
      }

      addQueryFilter({ column, operator, value });
    },
    [
      addQueryFilter,
      removeQueryFilter,
      setQueryFilters,
      queryFilters,
      defaultOperator,
      defaultBehavior,
      isDemo,
      t,
    ],
  );

  const makeFilterClick = useCallback(
    (column: FilterColumn, opts?: Options) => (value: string) => applyFilter(column, value, opts),
    [applyFilter],
  );

  return { applyFilter, makeFilterClick };
}
