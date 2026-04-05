'use client';

import { useMemo } from 'react';
import type { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { useUrlFilters } from './use-url-filters';

export function useAnalyticsQuery(): BAAnalyticsQuery {
  const {
    startDate,
    endDate,
    granularity,
    timezone,
    compareStartDate,
    compareEndDate,
    interval,
    offset,
    compare,
    compareAlignWeekdays,
    queryFilters,
    userJourney: { numberOfSteps, numberOfJourneys },
  } = useUrlFilters();

  return useMemo(
    () => ({
      startDate,
      endDate,
      compareStartDate,
      compareEndDate,
      granularity,
      queryFilters,
      timezone,
      userJourney: { numberOfSteps, numberOfJourneys },
      interval,
      offset,
      compare,
      compareAlignWeekdays,
    }),
    [
      startDate,
      endDate,
      compareStartDate,
      compareEndDate,
      granularity,
      queryFilters,
      timezone,
      numberOfSteps,
      numberOfJourneys,
      interval,
      offset,
      compare,
      compareAlignWeekdays,
    ],
  );
}
