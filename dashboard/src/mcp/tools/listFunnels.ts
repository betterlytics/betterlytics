import { McpDateRangeSchema, customDateRangeRefinement, dateOrderRefinement } from '@/mcp/entities/mcp.entities';
import { resolveTimeRange } from '@/mcp/utils/resolveTimeRange';
import { getFunnelsByDashboardId } from '@/services/analytics/funnels.service';

export const McpListFunnelsInputBaseSchema = McpDateRangeSchema;

export const McpListFunnelsInputSchema = McpListFunnelsInputBaseSchema
  .refine(customDateRangeRefinement.check, customDateRangeRefinement)
  .refine(dateOrderRefinement.check, dateOrderRefinement);

export async function executeListFunnels(rawInput: unknown, siteId: string, dashboardId: string) {
  const input = McpListFunnelsInputSchema.parse(rawInput);
  const { start, end } = resolveTimeRange(input);

  return getFunnelsByDashboardId(dashboardId, siteId, start, end);
}
