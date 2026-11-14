import { z } from 'zod';
import { McpDateRangeSchema, customDateRangeRefinement, dateOrderRefinement } from '@/mcp/entities/mcp.entities';
import { resolveTimeRange } from '@/mcp/utils/resolveTimeRange';
import { buildSiteQuery } from '@/mcp/utils/buildSiteQuery';
import {
  getTopGlobalPropertyKeys,
  getTopGlobalPropertyValuesForKeys,
} from '@/repositories/clickhouse/globalProperties.repository';
import { FilterColumnSchema } from '@/entities/analytics/filter.entities';
import { PROPERTY_SOURCES } from '@/entities/analytics/propertySources';

const GP_PREFIX = PROPERTY_SOURCES.gp.prefix;

// Keys are one string + a count each, so we can afford a generous limit and still
// stay light on context. Values are the heavy part, so they're fetched per key on demand.
const GP_KEY_LIMIT = 100;
const GP_VALUE_LIMIT = 20;

const bareGlobalPropertyKey = (key: string) => (key.startsWith(GP_PREFIX) ? key.slice(GP_PREFIX.length) : key);

const McpListGlobalPropertiesInputBaseSchema = McpDateRangeSchema.extend({
  key: z
    .string()
    .optional()
    .describe(
      'A property key as returned by this tool, e.g. "gp.plan". If given, returns example values for that key instead of the key list.',
    ),
});

export const McpListGlobalPropertiesInputSchema = McpListGlobalPropertiesInputBaseSchema.refine(
  customDateRangeRefinement.check,
  customDateRangeRefinement,
)
  .refine(dateOrderRefinement.check, dateOrderRefinement)
  .refine(
    ({ key }) => !key || FilterColumnSchema.safeParse(`${GP_PREFIX}${bareGlobalPropertyKey(key)}`).success,
    ({ key }) => ({ message: `Invalid global property key: "${key}"` }),
  );

export async function executeListGlobalProperties(rawInput: unknown, siteId: string) {
  const input = McpListGlobalPropertiesInputSchema.parse(rawInput);
  const timeRange = resolveTimeRange(input);

  const siteQuery = buildSiteQuery({ siteId, timeRange, timezone: input.timezone });

  if (input.key) {
    const bareKey = bareGlobalPropertyKey(input.key);
    const column = `${GP_PREFIX}${bareKey}`;
    const values = await getTopGlobalPropertyValuesForKeys(siteQuery, [bareKey], GP_VALUE_LIMIT);
    return {
      column,
      values: values.map((v) => v.value),
      truncated: values.length === GP_VALUE_LIMIT,
      ...(values.length === 0
        ? {
            note: 'No values recorded for this property in the selected time range. Re-check the key against the key list, or broaden the timeRange.',
          }
        : {}),
    };
  }

  const keys = await getTopGlobalPropertyKeys(siteQuery, GP_KEY_LIMIT);
  return {
    keys: keys.map((k) => `${GP_PREFIX}${k.property_key}`),
    truncated: keys.length === GP_KEY_LIMIT,
    note: 'Use a returned key as a filter column, e.g. { column: "gp.plan", operator: "=", values: ["pro"] }. Call this tool again with a "key" argument to see example values for a specific property.',
  };
}
