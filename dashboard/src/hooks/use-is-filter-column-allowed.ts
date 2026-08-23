'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { useQueryFilterColumnsVisibility } from '@/contexts/QueryFilterColumnsVisibilityProvider';
import { FILTER_COLUMN_SELECT_OPTIONS } from '@/components/filters/filterColumnOptions';
import {
  parseFilterColumn,
  type FilterColumn,
  type QueryFilter,
  type TableFilterColumn,
} from '@/entities/analytics/filter.entities';
import { type PropertySourceKind } from '@/entities/analytics/propertySources';
import { stripInfeasibleStepFilters, type StepFiltersBySlot } from '@/entities/analytics/stepFilters.entities';

const DEMO_ALLOWED_COLUMNS = new Set<TableFilterColumn>(['url', 'device_type']);

/**
 * Why a filter column cannot be used on the current page:
 * - `page`: the column is excluded here (its data is not available on this page)
 * - `demo`: demo mode does not permit this column
 */
export type FilterColumnDisabledReason = 'demo' | 'page';

export type FilterColumnStatus =
  | { disabled: false; reason: null }
  | { disabled: true; reason: FilterColumnDisabledReason };

const ENABLED: FilterColumnStatus = { disabled: false, reason: null };

/**
 * Resolves whether a whole property source (gp/cep) is usable on the current
 * page - pages exclude a source the same way they exclude a table column.
 */
export function usePropertySourceStatus() {
  const { isDemo } = useDashboardAuth();
  const { excluded } = useQueryFilterColumnsVisibility();
  return useCallback(
    (source: PropertySourceKind): FilterColumnStatus => {
      if (excluded.has(source)) return { disabled: true, reason: 'page' };
      return isDemo ? { disabled: true, reason: 'demo' } : ENABLED;
    },
    [isDemo, excluded],
  );
}

/**
 * Resolves whether a column is usable on the current page and, if not, why.
 * Per-page exclusion takes precedence over the demo reason.
 */
export function useFilterColumnStatus() {
  const { isDemo } = useDashboardAuth();
  const { excluded } = useQueryFilterColumnsVisibility();
  const getSourceStatus = usePropertySourceStatus();
  return useCallback(
    (column: FilterColumn): FilterColumnStatus => {
      const parsed = parseFilterColumn(column);
      if (parsed.kind === 'property') return getSourceStatus(parsed.source);
      if (excluded.has(parsed.col)) return { disabled: true, reason: 'page' };
      if (isDemo && !DEMO_ALLOWED_COLUMNS.has(parsed.col)) return { disabled: true, reason: 'demo' };
      return ENABLED;
    },
    [isDemo, excluded, getSourceStatus],
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

/** The default column for a new primary-filter row: the first the current page allows, or 'url'. */
export function useDefaultFilterColumn(): TableFilterColumn {
  const getStatus = useFilterColumnStatus();
  return useMemo(() => {
    const firstAllowed = FILTER_COLUMN_SELECT_OPTIONS.find((option) => !getStatus(option.value).disabled);
    return firstAllowed?.value ?? 'url';
  }, [getStatus]);
}

/** Filters a list of query filters down to those allowed on the current page. */
export function useAllowedQueryFilters(filters: QueryFilter[]): QueryFilter[] {
  const isFilterColumnAllowed = useIsFilterColumnAllowed();
  return useMemo(
    () => filters.filter((filter) => isFilterColumnAllowed(filter.column)),
    [filters, isFilterColumnAllowed],
  );
}

/**
 * Journey step filters bypass the page-level visibility provider - their
 * feasibility is slot-scoped (classifyStepFilter), not page-scoped. Only the
 * demo-mode restriction applies on top.
 */
export function useAllowedStepFilters(stepFilters: StepFiltersBySlot, numberOfSteps: number): StepFiltersBySlot {
  const { isDemo } = useDashboardAuth();
  return useMemo(() => {
    const feasible = stripInfeasibleStepFilters(stepFilters, numberOfSteps - 1);
    if (!isDemo) return feasible;
    const entries = Object.entries(feasible)
      .map(
        ([slot, filters]) =>
          [
            slot,
            filters.filter((filter) => {
              const parsed = parseFilterColumn(filter.column);
              return parsed.kind === 'standard' && DEMO_ALLOWED_COLUMNS.has(parsed.col);
            }),
          ] as const,
      )
      .filter(([, filters]) => filters.length > 0);
    return Object.fromEntries(entries);
  }, [stepFilters, numberOfSteps, isDemo]);
}
