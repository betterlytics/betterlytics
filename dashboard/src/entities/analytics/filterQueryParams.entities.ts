import z from 'zod';

import { GRANULARITY_RANGE_VALUES } from '@/utils/granularityRanges';
import { TIME_RANGE_VALUES } from '@/utils/timeRanges';
import { COMPARE_URL_MODES } from '@/utils/compareRanges';
import { QueryFilterSchema } from '@/entities/analytics/filter.entities';

export const FilterQueryParamsSchema = z.object({
  queryFilters: z.preprocess((val) => {
    if (Array.isArray(val)) {
      return val.map((filter) => {
        if (typeof filter === 'object' && filter !== null && 'value' in filter && !('values' in filter)) {
          const { value, ...rest } = filter as Record<string, unknown>;
          return { ...rest, values: [value] };
        }
        return filter;
      });
    }
    return val;
  }, z.array(QueryFilterSchema)),
  granularity: z.enum(GRANULARITY_RANGE_VALUES),
  startDate: z.date(),
  endDate: z.date(),
  compareStartDate: z.date().optional(),
  compareEndDate: z.date().optional(),
  interval: z.enum(TIME_RANGE_VALUES),
  offset: z.coerce.number().int().optional(),
  compare: z.enum(COMPARE_URL_MODES),
  compareAlignWeekdays: z.boolean().optional().default(false),
  userJourney: z.object({
    numberOfSteps: z.coerce.number(),
    numberOfJourneys: z.coerce.number(),
  }),
});

export type FilterQueryParams = z.infer<typeof FilterQueryParamsSchema>;
export type FilterQuerySearchParams = Partial<Record<keyof FilterQueryParams, string>>;
