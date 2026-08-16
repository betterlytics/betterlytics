import { z } from 'zod';
import { MAX_FILTER_ROWS, QueryFilterSchema } from '@/entities/analytics/filter.entities';
import { GRANULARITY_RANGE_VALUES } from '@/utils/granularityRanges';
import { TIME_RANGE_VALUES } from '@/utils/timeRanges';
import { COMPARE_URL_MODES } from '@/utils/compareRanges';

export const BATimeZone = z.string().transform((tz) => (tz === 'Etc/Unknown' ? 'Etc/UTC' : tz));

export const USER_JOURNEY_MIN_STEPS = 2;
export const USER_JOURNEY_MAX_STEPS = 6;

const UserJourneySchema = z
  .object({
    numberOfSteps: z.number().int().min(USER_JOURNEY_MIN_STEPS).max(USER_JOURNEY_MAX_STEPS),
    numberOfJourneys: z.number().int().min(1).max(100),
    stepFilters: z.record(z.string(), z.array(QueryFilterSchema).max(MAX_FILTER_ROWS)).default({}),
  })
  .superRefine((journey, ctx) => {
    for (const slot of Object.keys(journey.stepFilters)) {
      const parsed = Number(slot);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed >= journey.numberOfSteps) {
        ctx.addIssue({ code: 'custom', message: `Invalid step filter slot: ${slot}` });
      }
    }
  });

export const BAAnalyticsQuerySchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  compareStartDate: z.date().optional(),
  compareEndDate: z.date().optional(),
  granularity: z.enum(GRANULARITY_RANGE_VALUES),
  queryFilters: z.array(QueryFilterSchema).max(MAX_FILTER_ROWS),
  timezone: BATimeZone,
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
