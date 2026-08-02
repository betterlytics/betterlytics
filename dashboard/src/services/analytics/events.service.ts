'server-only';

import {
  getCustomEventsOverview,
  getEventPropertiesSummary,
  getEventPropertyValues,
  getEventsSince,
  getRecentEvents,
  getTotalEventCount,
} from '@/repositories/clickhouse/index.repository';
import {
  computeNextEventLogCursor,
  EventLogCursor,
  EventLogEntry,
  EventLogPage,
  EventPropertiesOverview,
  EventPropertyAnalytics,
  EventPropertyValues,
} from '@/entities/analytics/events.entities';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { calculatePercentage } from '@/utils/mathUtils';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const MAX_TOP_VALUES = 10;
const MAX_PROPERTY_VALUES = 1000;

export async function getCustomEventsOverviewForSite(siteQuery: BASiteQuery, limit: number) {
  return getCustomEventsOverview(siteQuery, limit);
}

export async function getRecentEventsForSite(
  siteId: string,
  queryFilters: QueryFilter[],
  limit: number,
  cursor: EventLogCursor | null,
): Promise<EventLogPage> {
  const events = await getRecentEvents(siteId, queryFilters, limit, cursor);
  return { events, nextCursor: computeNextEventLogCursor(events, cursor, limit) };
}

export async function getTotalEventCountForSite(siteId: string, queryFilters: QueryFilter[]): Promise<number> {
  return getTotalEventCount(siteId, queryFilters);
}

export async function getNewEventsForSite(
  siteId: string,
  queryFilters: QueryFilter[],
  since: Date,
  limit: number,
): Promise<EventLogEntry[]> {
  return getEventsSince(siteId, queryFilters, since, limit);
}

export async function getEventPropertiesAnalyticsForSite(
  siteQuery: BASiteQuery,
  eventName: string,
): Promise<EventPropertiesOverview> {
  const rows = await getEventPropertiesSummary(siteQuery, eventName, MAX_TOP_VALUES);

  // Rows arrive grouped per key (top values first); fold them into one entry per property.
  const propertyMap = new Map<string, EventPropertyAnalytics>();
  for (const row of rows) {
    let property = propertyMap.get(row.key);
    if (!property) {
      property = {
        propertyName: row.key,
        uniqueValueCount: row.unique_value_count,
        totalOccurrences: row.total_occurrences,
        topValues: [],
      };
      propertyMap.set(row.key, property);
    }
    property.topValues.push({
      value: row.value,
      count: row.count,
      percentage: calculatePercentage(row.count, row.total_occurrences),
      relativePercentage: calculatePercentage(row.count, row.total_occurrences),
    });
  }

  const properties = Array.from(propertyMap.values()).sort(
    (a, b) => b.totalOccurrences - a.totalOccurrences || (a.propertyName < b.propertyName ? -1 : 1),
  );

  return { eventName, properties, maxValues: MAX_PROPERTY_VALUES };
}

export async function getEventPropertyValuesForSite(
  siteQuery: BASiteQuery,
  eventName: string,
  propertyName: string,
): Promise<EventPropertyValues> {
  const rows = await getEventPropertyValues(siteQuery, eventName, propertyName, MAX_PROPERTY_VALUES);

  // Window aggregates are identical on every row; totals cover all values even when the list is capped.
  const totalOccurrences = rows[0]?.total_occurrences ?? 0;
  const uniqueValueCount = rows[0]?.unique_value_count ?? 0;

  return {
    propertyName,
    uniqueValueCount,
    totalOccurrences,
    values: rows.map((row) => ({
      value: row.value,
      count: row.count,
      percentage: calculatePercentage(row.count, totalOccurrences),
      relativePercentage: calculatePercentage(row.count, totalOccurrences),
    })),
  };
}
