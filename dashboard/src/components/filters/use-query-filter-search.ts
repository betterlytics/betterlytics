'use client';

import { getFilterOptionsAction } from '@/app/actions/analytics/filters';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { QueryFilter } from '@/entities/analytics/filter';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

const SEARCH_LIMIT = 5000;

type SearchMetadataResult = {
  shouldUseServerSearch: boolean;
};

export function useQueryFilterSearch(filter: QueryFilter) {
  const { startDate, endDate } = useTimeRangeContext();
  const dashboardId = useDashboardId();

  const [isDirty, setIsDirty] = useState(false);
  const [search, _setSearch] = useState(filter.value);

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

  const { data: fetchedOptions = [], isLoading } = useQuery({
    queryKey: ['filter-options', filter.column, startDate?.toString(), endDate?.toString(), debouncedSearch],
    queryFn: () =>
      getFilterOptionsAction(dashboardId, {
        startDate,
        endDate,
        column: filter.column,
        search: isDirty ? debouncedSearch || undefined : undefined,
        limit: SEARCH_LIMIT,
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: shouldSearchServer,
  });

  useEffect(() => {
    setSearchMetadataResult(null);
    setServerOptions([]);
  }, [filter.column]);

  useEffect(() => {
    setSearch(filter.value);
  }, [filter.value]);

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

  const options = useMemo(() => {
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
    return options.slice(0, 10);
  }, [options]);

  return { search, setSearch, isDirty, options: slicedOptions, isLoading };
}
