import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/analytics/filter.entities';

export type BAAnalyticsQuery = {
  startDate: Date;
  endDate: Date;
  compareStartDate?: Date;
  compareEndDate?: Date;
  granularity: GranularityRangeValues;
  queryFilters: QueryFilter[];
  timezone: string;
  userJourney: { numberOfSteps: number; numberOfJourneys: number };
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
