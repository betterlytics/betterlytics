'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { trpc } from '@/trpc/client';
import { type QueryFilter, type ScopeFilter } from '@/entities/analytics/filter.entities';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { type useAnalyticsQuery } from '@/hooks/use-analytics-query';

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

const DEFAULT_FILTER_OPTIONS_SOURCE: FilterOptionsSource = {
  useFilterOptionsQuery: useDefaultFilterOptionsQuery,
};

const FilterOptionsSourceContext = createContext<FilterOptionsSource>(DEFAULT_FILTER_OPTIONS_SOURCE);

export function FilterOptionsSourceProvider({ source, children }: { source: FilterOptionsSource; children: ReactNode }) {
  return <FilterOptionsSourceContext.Provider value={source}>{children}</FilterOptionsSourceContext.Provider>;
}

export function useFilterOptionsSource(): FilterOptionsSource {
  return useContext(FilterOptionsSourceContext);
}
