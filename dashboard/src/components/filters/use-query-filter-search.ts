'use client';

import { trpc } from '@/trpc/client';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDebounce } from '@/hooks/useDebounce';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { subDays } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';

const SEARCH_LIMIT = 5000;
const EXTENDED_RANGE_DAYS = 30;
const EMPTY_OPTIONS: string[] = [];

type SearchMetadataResult = {
  shouldUseServerSearch: boolean;
};

type UseQueryFilterSearchOptions = {
  useExtendedRange?: boolean;
};

export function useQueryFilterSearch(filter: QueryFilter, options?: UseQueryFilterSearchOptions) {
  const baseQuery = useAnalyticsQuery();

  // When useExtendedRange is true, it uses a range of minimum 30 days
  const query = useMemo(() => {
    if (!options?.useExtendedRange) {
      return baseQuery;
    }

    const extendedStartDate = subDays(baseQuery.endDate, EXTENDED_RANGE_DAYS);

    const effectiveStartDate =
      baseQuery.startDate && baseQuery.startDate < extendedStartDate ? baseQuery.startDate : extendedStartDate;

    return { ...baseQuery, startDate: effectiveStartDate };
  }, [options?.useExtendedRange, baseQuery]);

  const dashboardId = useDashboardId();

  const [isDirty, setIsDirty] = useState(false);
  const [search, _setSearch] = useState('');

  const setSearch = useCallback((next: string) => {
    _setSearch(next);
    setIsDirty(true);
  }, []);

  const debouncedSearch = useDebounce(search, 350);

  const [serverOptions, setServerOptions] = useState<string[]>([]);
  const [searchMetadataResult, setSearchMetadataResult] = useState<SearchMetadataResult | null>(null);

  const shouldSearchServer = useMemo(() => {
    return searchMetadataResult === null || searchMetadataResult.shouldUseServerSearch;
  }, [searchMetadataResult]);

  const { data: fetchedOptions = EMPTY_OPTIONS, isLoading } = trpc.filters.getFilterOptions.useQuery(
    {
      dashboardId,
      query,
      column: filter.column,
      search: isDirty ? debouncedSearch || undefined : undefined,
      limit: SEARCH_LIMIT,
    },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      enabled: shouldSearchServer,
    },
  );

  useEffect(() => {
    setSearchMetadataResult(null);
    setServerOptions([]);
  }, [filter.column]);

  useEffect(() => {
    if (shouldSearchServer && isLoading === false) {
      setServerOptions(fetchedOptions);
    }
  }, [fetchedOptions, shouldSearchServer, isLoading]);

  useEffect(() => {
    if (searchMetadataResult === null && isLoading === false) {
      setSearchMetadataResult({ shouldUseServerSearch: fetchedOptions.length > SEARCH_LIMIT });
    }
  }, [fetchedOptions.length, searchMetadataResult, isLoading]);

  const filteredOptions = useMemo(() => {
    if (shouldSearchServer) {
      return serverOptions;
    } else {
      if (search.length === 0) {
        return serverOptions;
      }
      return serverOptions.filter((option) => option.toLowerCase().includes(search.toLowerCase()));
    }
  }, [shouldSearchServer, serverOptions, search]);

  const slicedOptions = useMemo(() => {
    return filteredOptions.slice(0, 10);
  }, [filteredOptions]);

  return { search, setSearch, isDirty, options: slicedOptions, isLoading };
}
