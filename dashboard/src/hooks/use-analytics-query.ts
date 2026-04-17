'use client';

import { useMemo } from 'react';
import type { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { useUrlFilters } from './use-url-filters';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

export function useAnalyticsQuery(): BAAnalyticsQuery {
  const urlFilters = useUrlFilters();

  // In realtime mode, dates and granularity come from the context's resolved ranges
  // rather than from useUrlFilters. useUrlFilters recomputes dates from Date.now() on
  // every render, which means a re-render that crosses a minute boundary produces a
  // new query key mid-flight, causing a double-fetch when invalidate() also fires.
  const { resolvedMainRange, resolvedCompareRange, resolvedGranularity } = useTimeRangeContext();
  const isRealtime = urlFilters.interval === 'realtime';

  return useMemo(
    () =>
      isRealtime
        ? {
            ...urlFilters,
            startDate: resolvedMainRange.start,
            endDate: resolvedMainRange.end,
            compareStartDate: resolvedCompareRange?.start,
            compareEndDate: resolvedCompareRange?.end,
            granularity: resolvedGranularity,
          }
        : urlFilters,
    [urlFilters, resolvedMainRange, resolvedCompareRange, resolvedGranularity],
  );
}
