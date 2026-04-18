'use client';

import { keepPreviousData } from '@tanstack/react-query';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useTimeRangeQueryOptions } from '@/hooks/useTimeRangeQueryOptions';

function useDashboardInput() {
  const dashboardId = useDashboardId();
  const query = useAnalyticsQuery();
  return { dashboardId, query };
}

function useDashboardQueryOptions() {
  const timeRangeOptions = useTimeRangeQueryOptions();
  return {
    ...timeRangeOptions,
    placeholderData: keepPreviousData,
  };
}

export function useBAQueryParams() {
  const input = useDashboardInput();
  const options = useDashboardQueryOptions();
  return { input, options };
}
