'use client';

import { useMemo } from 'react';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useTimeRangeQueryOptions } from '@/hooks/useTimeRangeQueryOptions';
import { stableStringify } from '@/utils/stableStringify';
import type { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';

type BAQueryFn<T> = (dashboardId: string, query: BAAnalyticsQuery) => Promise<T>;

type UseBAQueryOptionsInput<T> = {
  queryKey: readonly unknown[];
  queryFn: BAQueryFn<T>;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number | false;
};

export function useBAQueryOptions<T>({
  queryKey,
  queryFn,
  staleTime: staleTimeOverride,
  gcTime: gcTimeOverride,
  refetchOnWindowFocus: refetchOnWindowFocusOverride,
  refetchInterval: refetchIntervalOverride,
}: UseBAQueryOptionsInput<T>) {
  const dashboardId = useDashboardId();
  const query = useAnalyticsQuery();
  const timeRangeOptions = useTimeRangeQueryOptions();

  const queryKeyStable = useMemo(
    () => [...queryKey, dashboardId, stableStringify(query)],
    [queryKey, dashboardId, query],
  );

  return {
    queryKey: queryKeyStable,
    queryFn: () => queryFn(dashboardId, query),
    staleTime: staleTimeOverride ?? timeRangeOptions.staleTime,
    gcTime: gcTimeOverride ?? timeRangeOptions.gcTime,
    refetchOnWindowFocus: refetchOnWindowFocusOverride ?? timeRangeOptions.refetchOnWindowFocus,
    refetchInterval: refetchIntervalOverride ?? timeRangeOptions.refetchInterval,
  };
}

export type { BAQueryFn, UseBAQueryOptionsInput };
