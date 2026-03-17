import { z } from 'zod';
import { QueryFilterSchema } from '@/entities/analytics/filter.entities';
import { GRANULARITY_RANGE_VALUES } from '@/utils/granularityRanges';
import { TIME_RANGE_VALUES } from '@/utils/timeRanges';
import { COMPARE_URL_MODES } from '@/utils/compareRanges';

const UserJourneySchema = z.object({
  numberOfSteps: z.number(),
  numberOfJourneys: z.number(),
});

export const BAAnalyticsQuerySchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  compareStartDate: z.date().optional(),
  compareEndDate: z.date().optional(),
  granularity: z.enum(GRANULARITY_RANGE_VALUES),
  queryFilters: z.array(QueryFilterSchema),
  timezone: z.string(),
  userJourney: UserJourneySchema,
  interval: z.enum(TIME_RANGE_VALUES),
  offset: z.number().optional(),
  compare: z.enum(COMPARE_URL_MODES),
  compareAlignWeekdays: z.boolean().optional(),
});

export type BAAnalyticsQuery = z.infer<typeof BAAnalyticsQuerySchema>;

export type BASiteQuery = {
  siteId: string;
  startDate: Date;
  endDate: Date;
  startDateTime: string;
  endDateTime: string;
  granularity: BAAnalyticsQuery['granularity'];
  queryFilters: BAAnalyticsQuery['queryFilters'];
  timezone: string;
  userJourney: BAAnalyticsQuery['userJourney'];
};
