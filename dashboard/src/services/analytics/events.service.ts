'server-only';

import {
  getCustomEventsOverview,
  getEventPropertyData,
  getRecentEvents,
  getRecentEventsCursor,
  getTotalEventCount,
} from '@/repositories/clickhouse/index.repository';
import { toDateTimeString } from '@/utils/dateFormatters';
import {
  EventPropertiesOverview,
  EventPropertyAnalytics,
  EventPropertyValue,
  EventLogEntry,
  DEFAULT_EVENT_LOG_SORT,
  type EventLogSortConfig,
} from '@/entities/analytics/events.entities';
import { calculatePercentage } from '@/utils/mathUtils';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { decodeCursor, createCursorPaginatedResponse } from '@/lib/cursor-pagination';
import type { CursorPaginatedResult } from '@/entities/pagination.entities';

const MAX_TOP_VALUES = 10;

export async function getCustomEventsOverviewForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
) {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getCustomEventsOverview(siteId, formattedStart, formattedEnd, queryFilters);
}

export async function getRecentEventsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  limit?: number,
  offset?: number,
  queryFilters?: QueryFilter[],
) {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getRecentEvents(siteId, formattedStart, formattedEnd, limit, offset, queryFilters);
}

/**
 * Fetch recent events with cursor-based pagination
 */
export async function getRecentEventsForSiteCursor(
  siteId: string,
  startDate: Date,
  endDate: Date,
  cursor: string | null,
  limit: number,
  queryFilters?: QueryFilter[],
  sortConfig?: EventLogSortConfig,
): Promise<CursorPaginatedResult<EventLogEntry>> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  const validatedSortConfig = sortConfig ?? DEFAULT_EVENT_LOG_SORT;
  const decodedCursor = decodeCursor(cursor);

  const items = await getRecentEventsCursor(
    siteId,
    formattedStart,
    formattedEnd,
    validatedSortConfig,
    decodedCursor,
    limit,
    queryFilters,
  );

  // Map sort fields to the keys in EventLogEntry for cursor extraction
  const fieldToCursorKey = {
    timestamp: 'timestamp' as const,
    visitorId: 'visitor_id' as const,
  };

  return createCursorPaginatedResponse(items, limit, validatedSortConfig, fieldToCursorKey);
}

export async function getTotalEventCountForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
) {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getTotalEventCount(siteId, formattedStart, formattedEnd, queryFilters);
}

export async function getEventPropertiesAnalyticsForSite(
  siteId: string,
  eventName: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
): Promise<EventPropertiesOverview> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  const rawPropertyData = await getEventPropertyData(
    siteId,
    eventName,
    formattedStart,
    formattedEnd,
    queryFilters,
  );

  const totalEvents = rawPropertyData.length;
  const properties = processPropertyData(rawPropertyData);

  return {
    eventName,
    totalEvents,
    properties,
  };
}

function processPropertyData(rawPropertyData: Array<{ custom_event_json: string }>): EventPropertyAnalytics[] {
  const propertyMap = new Map<string, Map<string, number>>();

  rawPropertyData.forEach((row) => {
    try {
      const properties = JSON.parse(row.custom_event_json);

      Object.entries(properties).forEach(([key, value]) => {
        if (!propertyMap.has(key)) {
          propertyMap.set(key, new Map());
        }

        const valueStr = String(value);
        const valueMap = propertyMap.get(key)!;
        valueMap.set(valueStr, (valueMap.get(valueStr) || 0) + 1);
      });
    } catch {
      // Skip invalid JSON
    }
  });

  return Array.from(propertyMap.entries()).map(([propertyName, valueMap]) => {
    const totalOccurrences = Array.from(valueMap.values()).reduce((sum, count) => sum + count, 0);

    const topValues = Array.from(valueMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, MAX_TOP_VALUES)
      .map(([value, count]) => ({
        value,
        count,
        percentage: calculatePercentage(count, totalOccurrences),
        relativePercentage: calculatePercentage(count, totalOccurrences),
      }));

    return {
      propertyName,
      uniqueValueCount: valueMap.size,
      totalOccurrences,
      topValues,
    };
  });
}
