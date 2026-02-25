import { z } from 'zod';
import { METRIC_KEYS } from '@/mcp/registry/metrics';
import { DIMENSION_KEYS } from '@/mcp/registry/dimensions';
import { FILTER_COLUMNS, FILTER_OPERATORS } from '@/entities/analytics/filter.entities';
const MCP_GRANULARITIES = ['hour', 'day'] as const;

const MCP_TIME_RANGES = [
  'realtime', 'today', 'yesterday', '1h', '24h',
  '7d', '28d', '90d', 'mtd', 'last_month', 'ytd', '1y',
] as const;

export const McpQueryInputSchema = z.object({
  metrics: z
    .array(z.string())
    .min(1)
    .refine((arr) => arr.every((m) => METRIC_KEYS.includes(m)), {
      message: `metrics must be one of: ${METRIC_KEYS.join(', ')}`,
    }),
  dimensions: z
    .array(z.string())
    .optional()
    .refine((arr) => !arr || arr.every((d) => DIMENSION_KEYS.includes(d)), {
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
  granularity: z.enum(MCP_GRANULARITIES).optional(),
  orderBy: z
    .string()
    .optional()
    .refine((val) => !val || METRIC_KEYS.includes(val) || DIMENSION_KEYS.includes(val), {
      message: `orderBy must be one of: ${[...METRIC_KEYS, ...DIMENSION_KEYS].join(', ')}`,
    }),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.number().int().min(1).max(10000).optional().default(100),
});

export type McpQueryInput = z.infer<typeof McpQueryInputSchema>;

export { MCP_TIME_RANGES, MCP_GRANULARITIES };
