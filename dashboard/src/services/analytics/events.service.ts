'server-only';

import {
  getCustomEventsOverview,
  getEventPropertyData,
  getRecentEvents,
  getTotalEventCount,
} from '@/repositories/clickhouse/index.repository';
import { toDateTimeString } from '@/utils/dateFormatters';
import {
  EventPropertiesOverview,
  EventPropertyAnalytics,
  EventPropertyValue,
} from '@/entities/analytics/events.entities';
import { calculatePercentage } from '@/utils/mathUtils';
import { QueryFilter } from '@/entities/analytics/filter.entities';

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
