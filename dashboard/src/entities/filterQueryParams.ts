import z from 'zod';

import { GRANULARITY_RANGE_VALUES } from '@/utils/granularityRanges';
import { QueryFilterSchema } from '@/entities/filter';

export const FilterQueryParamsSchema = z.object({
  queryFilters: z.array(QueryFilterSchema),
  granularity: z.enum(GRANULARITY_RANGE_VALUES),
  startDate: z.date(),
  endDate: z.date(),
  compareEnabled: z.boolean().optional(),
  compareStartDate: z.date().optional(),
  compareEndDate: z.date().optional(),
  userJourney: z
    .object({
      numberOfSteps: z.number(),
      numberOfJourneys: z.number(),
    })
    .optional(),
});

export type FilterQueryParams = z.infer<typeof FilterQueryParamsSchema>;
