'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { useHiddenQueryFilterColumns } from '@/contexts/QueryFilterColumnsVisibilityProvider';
import {
  parseFilterColumn,
  type FilterColumn,
  type QueryFilter,
  type TableFilterColumn,
} from '@/entities/analytics/filter.entities';

const DEMO_ALLOWED_COLUMNS = new Set<TableFilterColumn>(['url', 'device_type']);

/**
 * Why a filter column cannot be used on the current page:
 * - `page`: the column is hidden here (its data is not available on this page)
 * - `demo`: demo mode does not permit this column
 */
export type FilterColumnDisabledReason = 'demo' | 'page';

export type FilterColumnStatus =
  | { disabled: false; reason: null }
  | { disabled: true; reason: FilterColumnDisabledReason };

const ENABLED: FilterColumnStatus = { disabled: false, reason: null };

/**
 * Resolves whether a column is usable on the current page and, if not, why.
 * Per-page hiding takes precedence over the demo reason.
 */
export function useFilterColumnStatus() {
  const { isDemo } = useDashboardAuth();
  const hidden = useHiddenQueryFilterColumns();
  return useCallback(
    (column: FilterColumn): FilterColumnStatus => {
      const parsed = parseFilterColumn(column);
      if (parsed.kind === 'gp') return isDemo ? { disabled: true, reason: 'demo' } : ENABLED;
      if (hidden.has(parsed.col)) return { disabled: true, reason: 'page' };
      if (isDemo && !DEMO_ALLOWED_COLUMNS.has(parsed.col)) return { disabled: true, reason: 'demo' };
      return ENABLED;
    },
    [isDemo, hidden],
  );
}

/**
 * Maps a column status to a human-readable reason it is disabled (null when enabled).
 * Centralizes the reason -> message mapping so call sites don't re-derive it.
 */
export function useFilterColumnDisabledMessage() {
  const t = useTranslations('components.filters');
  const tDemo = useTranslations('components.demoMode');
  return useCallback(
    (status: FilterColumnStatus): string | null => {
      switch (status.reason) {
        case 'page':
          return t('notAvailableOnPage');
        case 'demo':
          return tDemo('notAvailable');
        default:
          return null;
      }
    },
    [t, tDemo],
  );
}

/** Whether a column is usable: composes demo-mode allow-listing with per-page visibility. */
export function useIsFilterColumnAllowed() {
  const getStatus = useFilterColumnStatus();
  return useCallback((column: FilterColumn): boolean => !getStatus(column).disabled, [getStatus]);
}

/** Filters a list of query filters down to those allowed on the current page. */
export function useAllowedQueryFilters(filters: QueryFilter[]): QueryFilter[] {
  const isFilterColumnAllowed = useIsFilterColumnAllowed();
  return useMemo(
    () => filters.filter((filter) => isFilterColumnAllowed(filter.column)),
    [filters, isFilterColumnAllowed],
  );
}
