import z from 'zod';

import { GRANULARITY_RANGE_VALUES } from '@/utils/granularityRanges';
import { TIME_RANGE_VALUES } from '@/utils/timeRanges';
import { COMPARE_URL_MODES } from '@/utils/compareRanges';
import { QueryFilterSchema } from '@/entities/filter';

export const FilterQueryParamsSchema = z.object({
  queryFilters: z.array(QueryFilterSchema),
  granularity: z.enum(GRANULARITY_RANGE_VALUES),
  startDate: z.date(),
  endDate: z.date(),
  compareStartDate: z.date().optional(),
  compareEndDate: z.date().optional(),
  interval: z.enum(TIME_RANGE_VALUES),
  offset: z.number().int().optional(),
  compare: z.enum(COMPARE_URL_MODES),
  userJourney: z.object({
    numberOfSteps: z.number(),
    numberOfJourneys: z.number(),
  }),
});

export type FilterQueryParams = z.infer<typeof FilterQueryParamsSchema>;
export type FilterQuerySearchParams = Partial<Record<keyof FilterQueryParams, string>>;
