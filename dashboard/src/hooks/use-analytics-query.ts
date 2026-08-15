'use client';

import { useMemo } from 'react';
import type { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import { useAllowedQueryFilters, useAllowedStepFilters } from '@/hooks/use-is-filter-column-allowed';

export function useAnalyticsQuery(): BAAnalyticsQuery {
  const {
    resolvedMainRange,
    resolvedCompareRange,
    resolvedGranularity,
    interval,
    offset,
    compareMode,
    compareAlignWeekdays,
    timeZone,
  } = useTimeRangeContext();
  const { queryFilters } = useQueryFiltersContext();
  const { numberOfSteps, numberOfJourneys, stepFilters } = useUserJourneyFilter();
  const allowedQueryFilters = useAllowedQueryFilters(queryFilters);
  const allowedStepFilters = useAllowedStepFilters(stepFilters, numberOfSteps);

  return useMemo(
    () => ({
      startDate: resolvedMainRange.start,
      endDate: resolvedMainRange.end,
      compareStartDate: resolvedCompareRange?.start,
      compareEndDate: resolvedCompareRange?.end,
      granularity: resolvedGranularity,
      interval,
      offset,
      compare: compareMode,
      compareAlignWeekdays,
      timezone: timeZone,
      queryFilters: allowedQueryFilters,
      userJourney: { numberOfSteps, numberOfJourneys, stepFilters: allowedStepFilters },
    }),
    [
      resolvedMainRange,
      resolvedCompareRange,
      resolvedGranularity,
      interval,
      offset,
      compareMode,
      compareAlignWeekdays,
      timeZone,
      allowedQueryFilters,
      numberOfSteps,
      numberOfJourneys,
      allowedStepFilters,
    ],
  );
}
