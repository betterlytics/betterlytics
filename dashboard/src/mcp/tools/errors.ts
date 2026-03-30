import { z } from 'zod';
import {
  McpDateRangeSchema,
  McpFiltersSchema,
  customDateRangeRefinement,
  dateOrderRefinement,
} from '@/mcp/entities/mcp.entities';
import { resolveTimeRange } from '@/mcp/utils/resolveTimeRange';
import {
  getErrorGroupForSite,
  getErrorGroupsForSite,
  getErrorGroupTimestampsForSite,
  getErrorOccurrenceForSite,
  getSessionTrailForSite,
} from '@/services/analytics/errors.service';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import type { ErrorGroupRow } from '@/entities/analytics/errors.entities';

export const McpListErrorsInputBaseSchema = McpDateRangeSchema.extend({
  filters: McpFiltersSchema,
  search: z
    .string()
    .optional()
    .describe(
      'Search filter for error type or message. Case-insensitive. E.g. "TypeError" or "Cannot read properties".',
    ),
  fingerprint: z
    .string()
    .optional()
    .describe('Look up a specific error by its fingerprint ID. Use a fingerprint from a previous list_errors call, or ask the user to retrieve it from the error details page in the Betterlytics dashboard.'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Max number of error groups to return (1-50). Defaults to 10.'),
});

const McpListErrorsInputSchema = McpListErrorsInputBaseSchema.refine(
  customDateRangeRefinement.check,
  customDateRangeRefinement,
).refine(dateOrderRefinement.check, dateOrderRefinement);

function formatErrorGroup(
  g: ErrorGroupRow,
  firstSeen?: Date,
  lastSeen?: Date,
) {
  return {
    fingerprint: g.error_fingerprint,
    type: g.error_type,
    message: g.error_message,
    occurrences: g.count,
    sessions: g.session_count,
    status: g.status,
    first_seen: (firstSeen ?? g.first_seen)?.toISOString() ?? null,
    last_seen: (lastSeen ?? g.last_seen)?.toISOString() ?? null,
  };
}

async function lookupByFingerprint(siteId: string, dashboardId: string, fingerprint: string) {
  const group = await getErrorGroupForSite(siteId, dashboardId, fingerprint);
  if (!group) return { error_groups: [], total: 0 };
  return { error_groups: [formatErrorGroup(group)], total: 1 };
}

export async function executeListErrors(rawInput: unknown, siteId: string, dashboardId: string) {
  const input = McpListErrorsInputSchema.parse(rawInput);

  if (input.fingerprint) {
    return lookupByFingerprint(siteId, dashboardId, input.fingerprint);
  }

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
    userJourney: { numberOfSteps: 3, numberOfJourneys: 50 },
  };

  let groups = await getErrorGroupsForSite(siteQuery, dashboardId);

  if (input.search) {
    const needle = input.search.toLowerCase();
    groups = groups.filter(
      (g) => g.error_type.toLowerCase().includes(needle) || g.error_message.toLowerCase().includes(needle),
    );
  }

  const limited = groups.slice(0, input.limit);

  if (limited.length === 0) {
    return { error_groups: [], total: 0 };
  }

  const fingerprints = limited.map((g) => g.error_fingerprint);
  const { firstSeenMap, lastSeenMap } = await getErrorGroupTimestampsForSite(siteId, fingerprints);

  return {
    error_groups: limited.map((g) =>
      formatErrorGroup(g, firstSeenMap[g.error_fingerprint], lastSeenMap[g.error_fingerprint]),
    ),
    total: groups.length,
  };
}

export const McpGetErrorInputBaseSchema = z.object({
  fingerprint: z.string().describe('The error fingerprint identifier. Use list_errors to find it, or ask the user to retrieve it from the error details page in the Betterlytics dashboard.'),
  occurrenceOffset: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe('Offset for occurrence pagination. 0 = latest, 1 = second latest, etc. Defaults to 0.'),
  includeBreadcrumbs: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'Include breadcrumbs. The trail of user actions (page views, clicks, navigations) leading up to the error. Defaults to true.',
    ),
});

export async function executeGetError(rawInput: unknown, siteId: string) {
  const input = McpGetErrorInputBaseSchema.parse(rawInput);

  const occurrence = await getErrorOccurrenceForSite(siteId, input.fingerprint, input.occurrenceOffset);
  if (!occurrence) {
    return { error: 'No occurrence found for this fingerprint and offset.' };
  }

  const result: Record<string, unknown> = {
    error_type: occurrence.error_type,
    error_message: occurrence.error_message,
    url: occurrence.url,
    timestamp: occurrence.timestamp,
    browser: occurrence.browser,
    os: occurrence.os,
    device_type: occurrence.device_type,
    country_code: occurrence.country_code,
    mechanism: occurrence.mechanism,
    stacktrace: occurrence.frames.map((f) => ({
      function: f.fn,
      file: f.file,
      line: f.line,
      column: f.col,
      in_app: f.inApp,
    })),
  };

  if (input.includeBreadcrumbs && occurrence.session_id) {
    const trail = await getSessionTrailForSite(siteId, occurrence.session_id);
    result.breadcrumbs = trail.map((e) => ({
      timestamp: e.event.timestamp,
      type: e.label,
      url: e.event.url || undefined,
      count: e.count > 1 ? e.count : undefined,
    }));
  }

  return result;
}
