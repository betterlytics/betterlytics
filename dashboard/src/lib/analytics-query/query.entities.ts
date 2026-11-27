import { z } from 'zod';
import type { FilterColumn, FilterOperator } from '@/entities/analytics/filter.entities';
import type { TimeRangeValue } from '@/utils/timeRanges';
import type { GranularityRangeValues } from '@/utils/granularityRanges';
import { isValidDayKey, normalizeTimezone } from '@/utils/timezone';
import type { MetricKey } from '@/lib/analytics-query/registry/metrics';
import type { DimensionKey } from '@/lib/analytics-query/registry/dimensions';
import type { SessionMetricKey } from '@/lib/analytics-query/registry/sessionMetrics';
import type { SessionDimensionKey } from '@/lib/analytics-query/registry/sessionDimensions';

export const QUERY_GRANULARITIES = ['hour', 'day'] as const satisfies readonly GranularityRangeValues[];
export type QueryGranularity = (typeof QUERY_GRANULARITIES)[number];

type DateRangeFields = { timeRange: TimeRangeValue; startDate?: string; endDate?: string };

export type QueryDateRange = DateRangeFields & { timezone: string };

export const customDateRangeRefinement = {
  check: (data: DateRangeFields) =>
    data.timeRange !== 'custom' ||
    (!!data.startDate && !!data.endDate && isValidDayKey(data.startDate) && isValidDayKey(data.endDate)),
  message: 'startDate and endDate are required when timeRange is "custom", and must be real calendar dates',
};

export const dateOrderRefinement = {
  check: (data: DateRangeFields) => !(data.startDate && data.endDate) || data.startDate <= data.endDate,
  message: 'startDate must be before or equal to endDate',
};

/** Zod transform that normalises an IANA time zone and rejects unknown ones. */
export function timezoneTransform(tz: string, ctx: z.RefinementCtx) {
  const zone = normalizeTimezone(tz);
  if (!zone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Unknown timezone ${JSON.stringify(tz)}. Use an IANA time zone identifier such as "Europe/Berlin".`,
    });
    return z.NEVER;
  }
  return zone;
}

type FilterInput<Column extends string> = { column: Column; operator: FilterOperator; values: string[] };
export type QueryFilterInput = FilterInput<FilterColumn>;

type QueryShape = {
  granularity?: QueryGranularity;
  /** Checked against the registries by the builders; ignored by time series. */
  orderBy?: string;
  order: 'asc' | 'desc';
  limit: number;
};

export type EventQueryInput = QueryDateRange &
  QueryShape & {
    metrics: readonly MetricKey[];
    dimensions?: readonly DimensionKey[];
    filters?: readonly QueryFilterInput[];
  };

export const SESSION_PAGE_FILTER_COLUMNS = ['entry_page', 'exit_page'] as const;
export type SessionPageFilterColumn = (typeof SESSION_PAGE_FILTER_COLUMNS)[number];
export type SessionPageFilter = FilterInput<SessionPageFilterColumn>;

export function isSessionPageFilterColumn(column: string): column is SessionPageFilterColumn {
  return (SESSION_PAGE_FILTER_COLUMNS as readonly string[]).includes(column);
}

export type SessionQueryInput = QueryDateRange &
  QueryShape & {
    metrics: readonly SessionMetricKey[];
    dimensions?: readonly SessionDimensionKey[];
    /** The event filter columns plus entry and exit page, which apply to the selected sessions. */
    filters?: readonly FilterInput<FilterColumn | SessionPageFilterColumn>[];
  };

export const QueryResultSchema = z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()])));
export type QueryResult = z.infer<typeof QueryResultSchema>;
