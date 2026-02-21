'use client';

import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';

export function useAnalyticsQuery(): BAAnalyticsQuery {
  const { startDate, endDate, granularity, timeZone, compareStartDate, compareEndDate } = useTimeRangeContext();
  const { queryFilters } = useQueryFiltersContext();

  return {
    startDate,
    endDate,
    compareStartDate,
    compareEndDate,
    granularity,
    queryFilters,
    timezone: timeZone,
    userJourney: { numberOfSteps: 3, numberOfJourneys: 50 },
  };
}
