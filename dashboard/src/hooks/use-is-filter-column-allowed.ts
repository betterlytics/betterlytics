'use client';

import { useCallback, useMemo } from 'react';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { useQueryFilterColumnsVisibility } from '@/contexts/QueryFilterColumnsVisibilityProvider';
import {
  parseFilterColumn,
  type FilterColumn,
  type QueryFilter,
  type TableFilterColumn,
} from '@/entities/analytics/filter.entities';

const DEMO_ALLOWED_COLUMNS = new Set<TableFilterColumn>(['url', 'device_type']);

/** Whether a column is visible on the current page (per-page visibility only, ignores demo mode). */
export function useIsFilterColumnVisible(): (column: FilterColumn) => boolean {
  const visibility = useQueryFilterColumnsVisibility();
  return useCallback(
    (column: FilterColumn): boolean => {
      const parsed = parseFilterColumn(column);
      if (parsed.kind === 'gp') return true;
      return visibility[parsed.col];
    },
    [visibility],
  );
}

/** Whether a column is usable: composes demo-mode allow-listing with per-page visibility. */
export function useIsFilterColumnAllowed(): (column: FilterColumn) => boolean {
  const { isDemo } = useDashboardAuth();
  const visibility = useQueryFilterColumnsVisibility();
  return useCallback(
    (column: FilterColumn): boolean => {
      const parsed = parseFilterColumn(column);
      if (parsed.kind === 'gp') return !isDemo;
      if (isDemo && !DEMO_ALLOWED_COLUMNS.has(parsed.col)) return false;
      return visibility[parsed.col];
    },
    [isDemo, visibility],
  );
}

/** Filters a list of query filters down to those allowed on the current page. */
export function useAllowedQueryFilters(filters: QueryFilter[]): QueryFilter[] {
  const isFilterColumnAllowed = useIsFilterColumnAllowed();
  return useMemo(
    () => filters.filter((filter) => isFilterColumnAllowed(filter.column)),
    [filters, isFilterColumnAllowed],
  );
}
