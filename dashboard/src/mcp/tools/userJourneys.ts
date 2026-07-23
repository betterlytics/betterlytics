import { z } from 'zod';
import { McpDateRangeSchema, McpFiltersSchema, customDateRangeRefinement, dateOrderRefinement } from '@/mcp/entities/mcp.entities';
import { resolveTimeRange } from '@/mcp/utils/resolveTimeRange';
import { getUserJourneyForSankeyDiagram } from '@/services/analytics/userJourney.service';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export const McpUserJourneysInputBaseSchema = McpDateRangeSchema.extend({
  filters: McpFiltersSchema,
  maxSteps: z
    .number()
    .int()
    .min(2)
    .max(10)
    .optional()
    .default(3)
    .describe('Maximum journey depth (number of page transitions). Defaults to 3.'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(500)
    .optional()
    .default(50)
    .describe('Max number of top unique paths to include. Defaults to 50.'),
});

export const McpUserJourneysInputSchema = McpUserJourneysInputBaseSchema
  .refine(customDateRangeRefinement.check, customDateRangeRefinement)
  .refine(dateOrderRefinement.check, dateOrderRefinement);

export async function executeUserJourneys(rawInput: unknown, siteId: string) {
  const input = McpUserJourneysInputSchema.parse(rawInput);
  const { startDateTime, endDateTime, start, end } = resolveTimeRange(input);

  const filters = (input.filters ?? []).map((f, i) => ({ ...f, id: `mcp_filter_${i}` }));

  const siteQuery: BASiteQuery = {
    siteId,
    startDate: start,
    endDate: end,
    startDateTime,
    endDateTime,
    granularity: 'day',
    queryFilters: filters,
    timezone: input.timezone,
    userJourney: { numberOfSteps: input.maxSteps, numberOfJourneys: input.limit },
  };

  return getUserJourneyForSankeyDiagram(siteQuery, input.maxSteps, input.limit);
}
