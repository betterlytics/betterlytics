'use client';

import { keepPreviousData } from '@tanstack/react-query';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useTimeRangeQueryOptions } from '@/hooks/useTimeRangeQueryOptions';
import type { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { trpc } from '@/trpc/client';

type DashboardInput = { dashboardId: string; query: BAAnalyticsQuery };
type DashboardQueryOptions = ReturnType<typeof useDashboardQueryOptions>;

function useDashboardInput(): DashboardInput {
  const dashboardId = useDashboardId();
  const query = useAnalyticsQuery();
  return { dashboardId, query };
}

function useDashboardQueryOptions() {
  const timeRangeOptions = useTimeRangeQueryOptions();
  return {
    ...timeRangeOptions,
    placeholderData: keepPreviousData as never,
  };
}

export function useBAQuery<TResult>(
  fn: (t: typeof trpc, input: DashboardInput, options: DashboardQueryOptions) => TResult,
): TResult {
  const input = useDashboardInput();
  const options = useDashboardQueryOptions();
  return fn(trpc, input, options);
}
