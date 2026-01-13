'use client';

import { getFilterOptionsAction } from '@/app/actions/analytics/filters.actions';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Option } from '@/components/MultiSelect';
import { formatString } from '@/utils/formatters';

const SEARCH_LIMIT = 5000;
const EXTENDED_RANGE_DAYS = 30;
const DISPLAY_LIMIT = 10;

type UseQueryFilterSearchOptions = {
  useExtendedRange?: boolean;
  formatLength?: number;
};

export function useQueryFilterSearch(filter: QueryFilter, options?: UseQueryFilterSearchOptions) {
  const { startDate: dashboardStartDate, endDate: dashboardEndDate } = useTimeRangeContext();
  const formatLength = options?.formatLength ?? 30;

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

  // Track search mode - null means not yet determined
  const [shouldUseServerSearch, setShouldUseServerSearch] = useState<boolean | null>(null);

  // Store all options for client-side filtering
  const allOptionsRef = useRef<string[]>([]);

  // Reset state when filter column changes
  useEffect(() => {
    setShouldUseServerSearch(null);
    allOptionsRef.current = [];
  }, [filter.column]);

  // Initial fetch to determine search mode and get initial options
  const { data: initialOptions = [], isLoading } = useQuery({
    queryKey: ['filter-options-initial', filter.column, startDate?.toString(), endDate?.toString()],
    queryFn: async () => {
      const result = await getFilterOptionsAction(dashboardId, {
        startDate,
        endDate,
        column: filter.column,
        limit: SEARCH_LIMIT,
      });

      const needsServerSearch = result.length >= SEARCH_LIMIT;
      setShouldUseServerSearch(needsServerSearch);

      if (!needsServerSearch) {
        allOptionsRef.current = result;
      }

      return result;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Transform raw strings to MultiSelect Option format
  const toMultiSelectOptions = useCallback(
    (rawOptions: string[]): Option[] => {
      return rawOptions.map((opt) => ({
        label: formatString(opt, formatLength),
        value: opt,
      }));
    },
    [formatLength],
  );

  // Async search callback for MultiSelect
  const onSearch = useCallback(
    async (searchTerm: string): Promise<Option[]> => {
      // If still loading initial data, return empty
      if (shouldUseServerSearch === null) {
        return [];
      }

      if (shouldUseServerSearch) {
        // Server-side search for large datasets
        const results = await getFilterOptionsAction(dashboardId, {
          startDate,
          endDate,
          column: filter.column,
          search: searchTerm || undefined,
          limit: DISPLAY_LIMIT,
        });
        return toMultiSelectOptions(results);
      }

      // Client-side filtering for small datasets
      const filtered = searchTerm
        ? allOptionsRef.current.filter((opt) => opt.toLowerCase().includes(searchTerm.toLowerCase()))
        : allOptionsRef.current;

      return toMultiSelectOptions(filtered.slice(0, DISPLAY_LIMIT));
    },
    [shouldUseServerSearch, dashboardId, startDate, endDate, filter.column, toMultiSelectOptions],
  );

  // Default options include selected values that might not be in search results
  const defaultOptions = useMemo(() => {
    const searchOptions = toMultiSelectOptions(initialOptions.slice(0, DISPLAY_LIMIT));

    // Include selected values not in current results
    const selectedNotInResults = filter.values
      .filter((v) => !initialOptions.includes(v))
      .map((v) => ({
        label: formatString(v, formatLength),
        value: v,
      }));

    return [...selectedNotInResults, ...searchOptions];
  }, [initialOptions, filter.values, formatLength, toMultiSelectOptions]);

  return {
    defaultOptions,
    onSearch,
    isLoading,
  };
}
