import { z } from 'zod';
import { METRIC_KEYS } from '@/mcp/registry/metrics';
import { DIMENSION_KEYS } from '@/mcp/registry/dimensions';
import { FILTER_COLUMNS, FILTER_OPERATORS } from '@/entities/analytics/filter.entities';
const MCP_GRANULARITIES = ['hour', 'day'] as const;

const MCP_TIME_RANGES = [
  'realtime', 'today', 'yesterday', '1h', '24h',
  '7d', '28d', '90d', 'mtd', 'last_month', 'ytd', '1y', 'custom',
] as const;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const McpQueryInputSchema = z
  .object({
    metrics: z
      .array(z.string())
      .min(1)
      .refine((arr) => arr.every((m) => (METRIC_KEYS as readonly string[]).includes(m)), {
        message: `metrics must be one of: ${METRIC_KEYS.join(', ')}`,
      }),
    dimensions: z
      .array(z.string())
      .optional()
      .refine((arr) => !arr || arr.every((d) => (DIMENSION_KEYS as readonly string[]).includes(d)), {
        message: `dimensions must be one of: ${DIMENSION_KEYS.join(', ')}`,
      }),
    filters: z
      .array(
        z.object({
          column: z.enum(FILTER_COLUMNS),
          operator: z.enum(FILTER_OPERATORS),
          values: z.array(z.string()).min(1),
        }),
      )
      .optional(),
    timeRange: z.enum(MCP_TIME_RANGES),
    startDate: z
      .string()
      .regex(DATE_REGEX, 'startDate must be in YYYY-MM-DD format')
      .optional(),
    endDate: z
      .string()
      .regex(DATE_REGEX, 'endDate must be in YYYY-MM-DD format')
      .optional(),
    granularity: z.enum(MCP_GRANULARITIES).optional(),
    orderBy: z
      .string()
      .optional()
      .refine((val) => !val || (METRIC_KEYS as readonly string[]).includes(val) || (DIMENSION_KEYS as readonly string[]).includes(val), {
        message: `orderBy must be one of: ${[...METRIC_KEYS, ...DIMENSION_KEYS].join(', ')}`,
      }),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    limit: z.number().int().min(1).max(10000).optional().default(100),
  })
  .refine(
    (data) => {
      if (data.timeRange === 'custom') return !!data.startDate && !!data.endDate;
      return true;
    },
    { message: 'startDate and endDate are required when timeRange is "custom"' },
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) return data.startDate <= data.endDate;
      return true;
    },
    { message: 'startDate must be before or equal to endDate' },
  );

export type McpQueryInput = z.infer<typeof McpQueryInputSchema>;

const ORDER_BY_KEYS = [...METRIC_KEYS, ...DIMENSION_KEYS] as const;
export const McpOrderBySchema = z.enum(ORDER_BY_KEYS as [string, ...string[]]);

export { MCP_TIME_RANGES, MCP_GRANULARITIES };
