'use client';

import { dependencyScopeFilters, toScopeFilter, QueryFilter } from '@/entities/analytics/filter.entities';
import { useDebounce } from '@/hooks/useDebounce';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useFilterOptionsSource } from '@/components/filters/FilterOptionsSourceProvider';
import { subDays } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';

const SEARCH_LIMIT = 5000;
const EXTENDED_RANGE_DAYS = 30;

type SearchMetadataResult = {
  shouldUseServerSearch: boolean;
};

type UseQueryFilterSearchOptions = {
  useExtendedRange?: boolean;
  disabled?: boolean;
  siblingFilters?: QueryFilter[];
};

export function useQueryFilterSearch(filter: QueryFilter, options?: UseQueryFilterSearchOptions) {
  const disabled = options?.disabled ?? false;
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

  const scopeFilters = useMemo(
    () => dependencyScopeFilters(filter.column, options?.siblingFilters ?? []).map(toScopeFilter),
    [filter.column, options?.siblingFilters],
  );
  const scopeKey = useMemo(() => JSON.stringify(scopeFilters), [scopeFilters]);

  const source = useFilterOptionsSource();
  const { useFilterOptionsQuery } = source;
  const { options: fetchedOptions, isLoading, emptyIndicator } = useFilterOptionsQuery({
    filter,
    siblingFilters: options?.siblingFilters ?? [],
    query,
    column: filter.column,
    search: isDirty ? debouncedSearch || undefined : undefined,
    limit: SEARCH_LIMIT,
    scopeFilters: scopeFilters.length > 0 ? scopeFilters : undefined,
    enabled: shouldSearchServer && !disabled,
  });

  useEffect(() => {
    setSearchMetadataResult(null);
    _setSearch('');
    setIsDirty(false);
  }, [filter.column, scopeKey, source.scopeKey]);

  useEffect(() => {
    if (disabled) return;
    if (shouldSearchServer && isLoading === false) {
      setServerOptions(fetchedOptions);
    }
  }, [fetchedOptions, shouldSearchServer, isLoading, disabled]);

  useEffect(() => {
    if (disabled) return;
    if (searchMetadataResult === null && isLoading === false) {
      setSearchMetadataResult({ shouldUseServerSearch: fetchedOptions.length > SEARCH_LIMIT });
    }
  }, [fetchedOptions.length, searchMetadataResult, isLoading, disabled]);

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

  return { search, setSearch, isDirty, options: slicedOptions, isLoading, emptyIndicator };
}
