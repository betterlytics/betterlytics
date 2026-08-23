'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { trpc } from '@/trpc/client';
import { type QueryFilter, type ScopeFilter } from '@/entities/analytics/filter.entities';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { type useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useBAQueryParams } from '@/trpc/hooks';
import { useQueryState } from '@/hooks/use-query-state';
import { usePropertySourceStatus } from '@/hooks/use-is-filter-column-allowed';
import { type PropertyKeysBySource } from '@/entities/analytics/propertySources';

const EMPTY_OPTIONS: string[] = [];

export type FilterOptionsQueryInput = {
  filter: QueryFilter;
  siblingFilters: QueryFilter[];
  query: ReturnType<typeof useAnalyticsQuery>;
  column: QueryFilter['column'];
  search?: string;
  limit: number;
  scopeFilters?: ScopeFilter[];
  enabled: boolean;
};

export type FilterOptionsSource = {
  useFilterOptionsQuery: (
    input: FilterOptionsQueryInput,
  ) => { options: string[]; isLoading: boolean; emptyIndicator?: ReactNode; scopeKey?: string };
  usePropertyKeysQuery: (input: { enabled: boolean }) => PropertyKeysBySource;
};

const useDefaultFilterOptionsQuery: FilterOptionsSource['useFilterOptionsQuery'] = ({
  query,
  column,
  search,
  limit,
  scopeFilters,
  enabled,
}) => {
  const dashboardId = useDashboardId();
  const { data = EMPTY_OPTIONS, isLoading } = trpc.filters.getFilterOptions.useQuery(
    { dashboardId, query, column, search, limit, scopeFilters },
    { staleTime: 5 * 60 * 1000, gcTime: 5 * 60 * 1000, enabled },
  );
  return { options: data, isLoading };
};

const useDefaultPropertyKeysQuery: FilterOptionsSource['usePropertyKeysQuery'] = () => {
  const { input, options } = useBAQueryParams();
  const getSourceStatus = usePropertySourceStatus();

  const gpEnabled = !getSourceStatus('gp').disabled;
  const cepEnabled = !getSourceStatus('cep').disabled;

  const gpQuery = trpc.filters.getPropertyKeys.useQuery({ ...input, source: 'gp' }, { ...options, enabled: gpEnabled });
  const cepQuery = trpc.filters.getPropertyKeys.useQuery(
    { ...input, source: 'cep' },
    { ...options, enabled: cepEnabled },
  );

  const gp = useQueryState(gpQuery, gpEnabled);
  const cep = useQueryState(cepQuery, cepEnabled);

  return useMemo(
    () => ({
      gp: !gpEnabled || gp.loading ? undefined : (gp.data ?? []),
      cep: !cepEnabled || cep.loading ? undefined : (cep.data ?? []),
    }),
    [gpEnabled, cepEnabled, gp.loading, gp.data, cep.loading, cep.data],
  );
};

const DEFAULT_FILTER_OPTIONS_SOURCE: FilterOptionsSource = {
  useFilterOptionsQuery: useDefaultFilterOptionsQuery,
  usePropertyKeysQuery: useDefaultPropertyKeysQuery,
};

const FilterOptionsSourceContext = createContext<FilterOptionsSource>(DEFAULT_FILTER_OPTIONS_SOURCE);

export function FilterOptionsSourceProvider({ source, children }: { source: FilterOptionsSource; children: ReactNode }) {
  return <FilterOptionsSourceContext.Provider value={source}>{children}</FilterOptionsSourceContext.Provider>;
}

export function useFilterOptionsSource(): FilterOptionsSource {
  return useContext(FilterOptionsSourceContext);
}
