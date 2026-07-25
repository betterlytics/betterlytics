import z from 'zod';

import { GRANULARITY_RANGE_VALUES } from '@/utils/granularityRanges';
import { TIME_RANGE_VALUES } from '@/utils/timeRanges';
import { COMPARE_URL_MODES } from '@/utils/compareRanges';
import { MAX_FILTER_ROWS, QueryFilterSchema, type QueryFilter } from '@/entities/analytics/filter.entities';

/* Legacy URL shape: a single `value` instead of `values`. */
function migrateLegacyQueryFilter(filter: unknown): unknown {
  if (typeof filter === 'object' && filter !== null && 'value' in filter && !('values' in filter)) {
    const { value, ...rest } = filter as Record<string, unknown>;
    return { ...rest, values: [value] };
  }
  return filter;
}

/**
 * Validates each decoded query filter individually and drops the invalid ones,
 * so one malformed filter in the URL cannot invalidate the rest of the state.
 */
export function sanitizeQueryFilters(value: unknown): QueryFilter[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .slice(0, MAX_FILTER_ROWS)
    .map(migrateLegacyQueryFilter)
    .flatMap((filter) => {
      const parsed = QueryFilterSchema.safeParse(filter);
      return parsed.success ? [parsed.data] : [];
    });
}

export const FilterQueryParamsSchema = z.object({
  queryFilters: z.preprocess((val) => {
    if (Array.isArray(val)) {
      return val.slice(0, MAX_FILTER_ROWS).map(migrateLegacyQueryFilter);
    }
    return val;
  }, z.array(QueryFilterSchema)),
  granularity: z.enum(GRANULARITY_RANGE_VALUES),
  startDate: z.date(),
  endDate: z.date(),
  compareStartDate: z.date().optional(),
  compareEndDate: z.date().optional(),
  interval: z.enum(TIME_RANGE_VALUES),
  offset: z.number().int().optional(),
  compare: z.enum(COMPARE_URL_MODES),
  compareAlignWeekdays: z.boolean().optional().default(false),
  userJourney: z.object({
    numberOfSteps: z.number(),
    numberOfJourneys: z.number(),
  }),
});

export type FilterQueryParams = z.infer<typeof FilterQueryParamsSchema>;
export type FilterQuerySearchParams = Partial<Record<keyof FilterQueryParams, string>>;
