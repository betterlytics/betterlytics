import { getFilterOptionsAction } from '@/app/actions/filters';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { QueryFilter } from '@/entities/filter';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

const SEARCH_LIMIT = 5000;

type SearchMetadataResult = {
  shouldUseServerSearch: boolean;
};

export function useQueryFilterSearch(filter: QueryFilter) {
  const { startDate, endDate } = useTimeRangeContext();
  const dashboardId = useDashboardId();

  const [search, setSearch] = useState('');
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
        search: debouncedSearch || undefined,
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

  return { search, setSearch, options: slicedOptions, isLoading };
}
