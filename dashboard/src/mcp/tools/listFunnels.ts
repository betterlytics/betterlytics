import { McpDateRangeSchema, customDateRangeRefinement, dateOrderRefinement } from '@/mcp/entities/mcp.entities';
import { resolveTimeRange } from '@/mcp/utils/resolveTimeRange';
import { getFunnelsByDashboardId } from '@/services/analytics/funnels.service';
import { findDashboardBySiteId } from '@/repositories/postgres/dashboard.repository';

export const McpListFunnelsInputBaseSchema = McpDateRangeSchema;

export const McpListFunnelsInputSchema = McpListFunnelsInputBaseSchema
  .refine(customDateRangeRefinement.check, customDateRangeRefinement)
  .refine(dateOrderRefinement.check, dateOrderRefinement);

export async function executeListFunnels(rawInput: unknown, siteId: string) {
  const input = McpListFunnelsInputSchema.parse(rawInput);
  const { start, end } = resolveTimeRange(input);

  const dashboard = await findDashboardBySiteId(siteId);
  if (!dashboard) {
    throw new Error('No dashboard found for this site');
  }

  return getFunnelsByDashboardId(dashboard.id, siteId, start, end);
}
