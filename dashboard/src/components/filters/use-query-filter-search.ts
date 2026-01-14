'use client';

import { getFilterOptionsAction } from '@/app/actions/analytics/filters.actions';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';

const SEARCH_LIMIT = 5000;
const EXTENDED_RANGE_DAYS = 30;

type SearchMetadataResult = {
  shouldUseServerSearch: boolean;
};

type UseQueryFilterSearchOptions = {
  useExtendedRange?: boolean;
};

export function useQueryFilterSearch(filter: QueryFilter, options?: UseQueryFilterSearchOptions) {
  const { startDate: dashboardStartDate, endDate: dashboardEndDate } = useTimeRangeContext();

  // When useExtendedRange is true, it uses a range of minimum 30 days
  const { startDate, endDate } = useMemo(() => {
    if (!options?.useExtendedRange) {
      return { startDate: dashboardStartDate, endDate: dashboardEndDate };
    }

    const now = new Date();
    const extendedStartDate = subDays(now, EXTENDED_RANGE_DAYS);

    const effectiveStartDate =
      dashboardStartDate && dashboardStartDate < extendedStartDate ? dashboardStartDate : extendedStartDate;
    const effectiveEndDate = dashboardEndDate && dashboardEndDate > now ? dashboardEndDate : now;

    return { startDate: effectiveStartDate, endDate: effectiveEndDate };
  }, [options?.useExtendedRange, dashboardStartDate, dashboardEndDate]);

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
