import { z } from 'zod';
import { McpDateRangeSchema, customDateRangeRefinement, dateOrderRefinement } from '@/mcp/entities/mcp.entities';
import { FILTER_COLUMNS, FILTER_OPERATORS } from '@/entities/analytics/filter.entities';
import { resolveTimeRange } from '@/mcp/utils/resolveTimeRange';
import { getFunnelPreviewData } from '@/services/analytics/funnels.service';

const McpFunnelFilterSchema = z.object({
  column: z.enum(FILTER_COLUMNS),
  operator: z.enum(FILTER_OPERATORS),
  values: z.array(z.string()).min(1),
});

const McpFunnelStepSchema = z.object({
  name: z.string().min(1, 'Step name is required'),
  filters: z.array(McpFunnelFilterSchema).min(1).describe('Filters for this step (AND logic between filters)'),
});

export const McpFunnelPreviewInputBaseSchema = McpDateRangeSchema.extend({
  steps: z
    .array(McpFunnelStepSchema)
    .min(2, 'At least 2 funnel steps are required')
    .describe('Ordered funnel steps. Each step is a filter condition (e.g. url = "/pricing").'),
  isStrict: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, steps must occur sequentially without other pages in between. Defaults to false.'),
});

export const McpFunnelPreviewInputSchema = McpFunnelPreviewInputBaseSchema
  .refine(customDateRangeRefinement.check, customDateRangeRefinement)
  .refine(dateOrderRefinement.check, dateOrderRefinement);

export async function executeFunnelPreview(rawInput: unknown, siteId: string) {
  const input = McpFunnelPreviewInputSchema.parse(rawInput);
  const { start, end } = resolveTimeRange(input);

  const funnelSteps = input.steps.map((step, i) => ({
    id: `mcp_funnel_step_${i}`,
    name: step.name,
    filters: step.filters.map((filter, j) => ({
      ...filter,
      id: `mcp_funnel_step_${i}_filter_${j}`,
    })),
  }));

  return getFunnelPreviewData(siteId, start, end, funnelSteps, input.isStrict);
}
