'use client';

import { useCallback } from 'react';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { useQueryFilterColumnsVisibility } from '@/contexts/QueryFilterColumnsVisibilityProvider';
import {
  parseFilterColumn,
  type FilterColumn,
  type TableFilterColumn,
} from '@/entities/analytics/filter.entities';

const DEMO_ALLOWED_COLUMNS = new Set<TableFilterColumn>(['url', 'device_type']);

/**
 * Single source of truth for whether a filter column is currently usable.
 *
 * Composes demo-mode allow-listing with per-page visibility from
 * QueryFilterColumnsVisibilityProvider. Applied at every gate so dropdown,
 * chips, click-to-filter, and tRPC query payload stay consistent.
 *
 * Returned predicate is stable across renders (useCallback) so downstream
 * useMemo deps don't churn.
 */
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
