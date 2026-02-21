'use client';

import { useMemo } from 'react';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';
import type { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';

export function useAnalyticsQuery(): BAAnalyticsQuery {
  const {
    startDate,
    endDate,
    granularity,
    timeZone,
    compareStartDate,
    compareEndDate,
    interval,
    offset,
    compareMode,
    compareAlignWeekdays,
  } = useTimeRangeContext();
  const { queryFilters } = useQueryFiltersContext();
  const { numberOfSteps, numberOfJourneys } = useUserJourneyFilter();

  return useMemo(
    () => ({
      startDate,
      endDate,
      compareStartDate,
      compareEndDate,
      granularity,
      queryFilters,
      timezone: timeZone,
      userJourney: { numberOfSteps, numberOfJourneys },
      interval,
      offset,
      compare: compareMode,
      compareAlignWeekdays,
    }),
    [
      startDate,
      endDate,
      compareStartDate,
      compareEndDate,
      granularity,
      queryFilters,
      timeZone,
      numberOfSteps,
      numberOfJourneys,
      interval,
      offset,
      compareMode,
      compareAlignWeekdays,
    ],
  );
}
