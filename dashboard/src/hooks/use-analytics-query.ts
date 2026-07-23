'use client';

import { useMemo } from 'react';
import type { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';

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
  const { numberOfSteps, numberOfJourneys } = useUserJourneyFilter();

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
      queryFilters,
      userJourney: { numberOfSteps, numberOfJourneys },
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
      queryFilters,
      numberOfSteps,
      numberOfJourneys,
    ],
  );
}
