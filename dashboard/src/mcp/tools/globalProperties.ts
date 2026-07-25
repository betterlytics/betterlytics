import { z } from 'zod';
import {
  McpDateRangeSchema,
  customDateRangeRefinement,
  dateOrderRefinement,
} from '@/mcp/entities/mcp.entities';
import { resolveTimeRange } from '@/mcp/utils/resolveTimeRange';
import {
  getTopGlobalPropertyKeys,
  getTopGlobalPropertyValuesForKeys,
} from '@/repositories/clickhouse/globalProperties.repository';
import { GP_PREFIX } from '@/entities/analytics/filter.entities';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

// Keys are one string + a count each, so we can afford a generous limit and still
// stay light on context. Values are the heavy part, so they're fetched per key on demand.
const GP_KEY_LIMIT = 100;
const GP_VALUE_LIMIT = 20;

export const McpListGlobalPropertiesInputBaseSchema = McpDateRangeSchema.extend({
  key: z
    .string()
    .optional()
    .describe(
      'A global-property key (with or without the "gp." prefix). If given, returns example values for that key instead of the key list.',
    ),
});

export const McpListGlobalPropertiesInputSchema = McpListGlobalPropertiesInputBaseSchema
  .refine(customDateRangeRefinement.check, customDateRangeRefinement)
  .refine(dateOrderRefinement.check, dateOrderRefinement);

export async function executeListGlobalProperties(rawInput: unknown, siteId: string) {
  const input = McpListGlobalPropertiesInputSchema.parse(rawInput);
  const { startDateTime, endDateTime, start, end } = resolveTimeRange(input);

  const siteQuery: BASiteQuery = {
    siteId,
    startDate: start,
    endDate: end,
    startDateTime,
    endDateTime,
    granularity: 'day',
    queryFilters: [],
    timezone: input.timezone ?? 'UTC',
    userJourney: { numberOfSteps: 1, numberOfJourneys: 1 },
  };

  if (input.key) {
    const bareKey = input.key.startsWith(GP_PREFIX) ? input.key.slice(GP_PREFIX.length) : input.key;
    const values = await getTopGlobalPropertyValuesForKeys(siteQuery, [bareKey], GP_VALUE_LIMIT);
    return {
      column: `${GP_PREFIX}${bareKey}`,
      values: values.map((v) => v.value),
      truncated: values.length === GP_VALUE_LIMIT,
    };
  }

  const keys = await getTopGlobalPropertyKeys(siteQuery, GP_KEY_LIMIT);
  return {
    keys: keys.map((k) => `${GP_PREFIX}${k.property_key}`),
    truncated: keys.length === GP_KEY_LIMIT,
    note: 'Use a returned key as a filter column, e.g. { column: "gp.plan", operator: "=", values: ["pro"] }. Call this tool again with a "key" argument to see example values for a specific property.',
  };
}
