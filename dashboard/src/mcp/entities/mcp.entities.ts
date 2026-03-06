import { z } from 'zod';
import { METRIC_KEYS } from '@/mcp/registry/metrics';
import { DIMENSION_KEYS } from '@/mcp/registry/dimensions';
import { FILTER_COLUMNS, FILTER_OPERATORS } from '@/entities/analytics/filter.entities';
import { TIME_RANGE_VALUES } from '@/utils/timeRanges';
import type { GranularityRangeValues } from '@/utils/granularityRanges';

export const MCP_GRANULARITIES = ['hour', 'day'] as const satisfies readonly GranularityRangeValues[];

const VALID_ORDER_BY = new Set<string>([...METRIC_KEYS, ...DIMENSION_KEYS]);

export const McpDateRangeSchema = z.object({
  timeRange: z
    .enum(TIME_RANGE_VALUES)
    .describe('Time range preset, or "custom" with startDate/endDate'),
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
    .string()
    .default('UTC')
    .describe('IANA time zone identifier, e.g. "Europe/Berlin" or "America/New_York"'),
});

export const McpFiltersSchema = z
  .array(
    z.object({
      column: z.enum(FILTER_COLUMNS),
      operator: z.enum(FILTER_OPERATORS),
      values: z.array(z.string()).min(1),
    }),
  )
  .optional()
  .describe('Filters to apply');

export const McpQueryInputBaseSchema = McpDateRangeSchema.extend({
  metrics: z
    .array(z.enum(METRIC_KEYS))
    .min(1)
    .describe('Metrics to query, e.g. ["visitors", "pageviews"]'),
  dimensions: z
    .array(z.enum(DIMENSION_KEYS))
    .optional()
    .describe('Dimensions to group by, e.g. ["device_type"]'),
  filters: McpFiltersSchema,
  granularity: z
    .enum(MCP_GRANULARITIES)
    .optional()
    .describe('Time-series granularity. Omit for aggregate totals.'),
  orderBy: z
    .string()
    .refine((val) => VALID_ORDER_BY.has(val), {
      message: `orderBy must be one of: ${[...METRIC_KEYS, ...DIMENSION_KEYS].join(', ')}`,
    })
    .optional()
    .describe('Metric or dimension to sort by. Defaults to first metric.'),
  order: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort direction. Defaults to desc.'),
  limit: z.number().int().min(1).max(10000).optional().default(100).describe('Max rows to return. Defaults to 100.'),
});

type DateRangeFields = { timeRange: string; startDate?: string; endDate?: string };

export const customDateRangeRefinement = {
  check: (data: DateRangeFields) => data.timeRange !== 'custom' || (!!data.startDate && !!data.endDate),
  message: 'startDate and endDate are required when timeRange is "custom"',
};

export const dateOrderRefinement = {
  check: (data: DateRangeFields) => !(data.startDate && data.endDate) || data.startDate <= data.endDate,
  message: 'startDate must be before or equal to endDate',
};

export const McpQueryInputSchema = McpQueryInputBaseSchema
  .refine(customDateRangeRefinement.check, customDateRangeRefinement)
  .refine(dateOrderRefinement.check, dateOrderRefinement);

export type McpQueryInput = z.infer<typeof McpQueryInputSchema>;

export const McpQueryResultSchema = z.array(
  z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
);
export type McpQueryResult = z.infer<typeof McpQueryResultSchema>;
