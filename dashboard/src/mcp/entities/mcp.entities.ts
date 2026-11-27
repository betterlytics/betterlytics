import { z } from 'zod';
import { METRIC_KEYS } from '@/lib/analytics-query/registry/metrics';
import { DIMENSION_KEYS } from '@/lib/analytics-query/registry/dimensions';
import { SESSION_METRIC_KEYS } from '@/lib/analytics-query/registry/sessionMetrics';
import { SESSION_DIMENSION_KEYS } from '@/lib/analytics-query/registry/sessionDimensions';
import { FilterColumnSchema, FILTER_OPERATORS } from '@/entities/analytics/filter.entities';
import { TIME_RANGE_VALUES } from '@/utils/timeRanges';
import {
  QUERY_GRANULARITIES,
  SESSION_PAGE_FILTER_COLUMNS,
  customDateRangeRefinement,
  dateOrderRefinement,
  timezoneTransform,
} from '@/lib/analytics-query/query.entities';

const VALID_ORDER_BY = new Set<string>([...METRIC_KEYS, ...DIMENSION_KEYS, 'date']);

export const McpDateRangeSchema = z.object({
  timeRange: z
    .enum(TIME_RANGE_VALUES)
    .describe(
      `Time range preset. Valid values: ${TIME_RANGE_VALUES.join(', ')}. Use "custom" with startDate/endDate for arbitrary ranges.`,
    ),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be in YYYY-MM-DD format')
    .optional()
    .describe('Start date in YYYY-MM-DD format. Required when timeRange is "custom".'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format')
    .optional()
    .describe('End date in YYYY-MM-DD format (inclusive). Required when timeRange is "custom".'),
  timezone: z
    .string({
      required_error: 'timezone is required. Use an IANA time zone identifier such as "Europe/Berlin" or "UTC".',
    })
    .describe(
      'IANA time zone identifier, e.g. "Europe/Berlin", "America/New_York" or "UTC". Unknown time zones are rejected.',
    )
    .transform(timezoneTransform),
});

export const McpFiltersSchema = z
  .array(
    z.object({
      column: FilterColumnSchema,
      operator: z.enum(FILTER_OPERATORS),
      values: z.array(z.string()).min(1),
    }),
  )
  .optional()
  .describe('Filters to apply');

const McpQueryInputBaseSchema = McpDateRangeSchema.extend({
  metrics: z.array(z.enum(METRIC_KEYS)).min(1).describe('Metrics to query, e.g. ["visitors", "pageviews"]'),
  dimensions: z.array(z.enum(DIMENSION_KEYS)).optional().describe('Dimensions to group by, e.g. ["device_type"]'),
  filters: McpFiltersSchema,
  granularity: z
    .enum(QUERY_GRANULARITIES)
    .optional()
    .describe('Time-series granularity. Omit for aggregate totals.'),
  orderBy: z
    .string()
    .refine((val) => VALID_ORDER_BY.has(val), {
      message: `orderBy must be one of: date, ${[...METRIC_KEYS, ...DIMENSION_KEYS].join(', ')}`,
    })
    .optional()
    .describe(
      'Metric or dimension to sort by. Defaults to first metric. Time-series queries (with granularity) are always sorted by date.',
    ),
  order: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort direction. Defaults to desc.'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(10000)
    .optional()
    .default(100)
    .describe('Max rows to return. Defaults to 100.'),
});

type OrderFields = {
  metrics: readonly string[];
  dimensions?: readonly string[];
  granularity?: string;
  orderBy?: string;
};

const requestedOrderByRefinement = {
  check: (data: OrderFields) =>
    data.orderBy === undefined ||
    data.orderBy === 'date' ||
    data.metrics.includes(data.orderBy) ||
    (data.dimensions ?? []).includes(data.orderBy),
  message: 'orderBy must be "date" or one of the requested metrics or dimensions',
};

const orderByDateRefinement = {
  check: (data: OrderFields) => data.orderBy !== 'date' || data.granularity !== undefined,
  message: 'orderBy "date" needs a granularity; aggregate results have no date',
};

// Event time series ignore orderBy, and an unknown key already fails on the field itself.
const eventOrderByRefinement = {
  check: (data: OrderFields) =>
    data.granularity !== undefined ||
    data.orderBy === undefined ||
    !VALID_ORDER_BY.has(data.orderBy) ||
    requestedOrderByRefinement.check(data),
  message: requestedOrderByRefinement.message,
};

export const McpQueryInputSchema = McpQueryInputBaseSchema.refine(
  customDateRangeRefinement.check,
  customDateRangeRefinement,
)
  .refine(dateOrderRefinement.check, dateOrderRefinement)
  .refine(eventOrderByRefinement.check, eventOrderByRefinement)
  .refine(orderByDateRefinement.check, orderByDateRefinement);

export type McpQueryInput = z.infer<typeof McpQueryInputSchema>;

const McpSessionFiltersSchema = z
  .array(
    z.object({
      column: z.union([z.enum(SESSION_PAGE_FILTER_COLUMNS), FilterColumnSchema]),
      operator: z.enum(FILTER_OPERATORS),
      values: z.array(z.string()).min(1),
    }),
  )
  .optional()
  .describe('Filters to apply. Accepts the query filter columns plus entry_page and exit_page.');

const McpQuerySessionsInputBaseSchema = McpDateRangeSchema.extend({
  metrics: z
    .array(z.enum(SESSION_METRIC_KEYS))
    .min(1)
    .describe('Session metrics to query, e.g. ["sessions", "bounce_rate"]'),
  dimensions: z
    .array(z.enum(SESSION_DIMENSION_KEYS))
    .optional()
    .describe('Session dimensions to group by, e.g. ["entry_page"]'),
  filters: McpSessionFiltersSchema,
  granularity: z
    .enum(QUERY_GRANULARITIES)
    .optional()
    .describe('Time-series granularity. Omit for aggregate totals.'),
  orderBy: z
    .enum(['date', ...SESSION_METRIC_KEYS, ...SESSION_DIMENSION_KEYS])
    .optional()
    .describe(
      'Requested metric or dimension to sort by. Defaults to first metric. Time-series queries (with granularity) are always sorted by date.',
    ),
  order: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort direction. Defaults to desc.'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(10000)
    .optional()
    .default(100)
    .describe('Max rows to return. Defaults to 100.'),
});

export const McpQuerySessionsInputSchema = McpQuerySessionsInputBaseSchema.refine(
  customDateRangeRefinement.check,
  customDateRangeRefinement,
)
  .refine(dateOrderRefinement.check, dateOrderRefinement)
  .refine(requestedOrderByRefinement.check, requestedOrderByRefinement)
  .refine(orderByDateRefinement.check, orderByDateRefinement);

export type McpQuerySessionsInput = z.infer<typeof McpQuerySessionsInputSchema>;
