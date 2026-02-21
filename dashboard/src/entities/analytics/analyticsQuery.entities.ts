import type { GranularityRangeValues } from '@/utils/granularityRanges';
import type { QueryFilter } from '@/entities/analytics/filter.entities';
import type { TimeRangeValue } from '@/utils/timeRanges';
import type { CompareMode } from '@/utils/compareRanges';

export type BAAnalyticsQuery = {
  startDate: Date;
  endDate: Date;
  compareStartDate?: Date;
  compareEndDate?: Date;
  granularity: GranularityRangeValues;
  queryFilters: QueryFilter[];
  timezone: string;
  userJourney: { numberOfSteps: number; numberOfJourneys: number };
  interval: TimeRangeValue;
  offset?: number;
  compare: CompareMode;
  compareAlignWeekdays?: boolean;
};

export type BASiteQuery = {
  siteId: string;
  startDate: Date;
  endDate: Date;
  startDateTime: string;
  endDateTime: string;
  granularity: GranularityRangeValues;
  queryFilters: QueryFilter[];
  timezone: string;
  userJourney: { numberOfSteps: number; numberOfJourneys: number };
};
