'server-only';

import {
  getCustomEventsOverview,
  getEventPropertyData,
  getRecentEvents,
  getTotalEventCount,
} from '@/repositories/clickhouse/index.repository';
import {
  EventPropertiesOverview,
  EventPropertyAnalytics,
  EventPropertyValue,
} from '@/entities/analytics/events.entities';
import { calculatePercentage } from '@/utils/mathUtils';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const MAX_TOP_VALUES = 10;

export async function getCustomEventsOverviewForSite(siteQuery: BASiteQuery) {
  return getCustomEventsOverview(siteQuery);
}

export async function getRecentEventsForSite(siteQuery: BASiteQuery, limit?: number, offset?: number) {
  return getRecentEvents(siteQuery, limit, offset);
}

export async function getTotalEventCountForSite(siteQuery: BASiteQuery) {
  return getTotalEventCount(siteQuery);
}

export async function getEventPropertiesAnalyticsForSite(
  siteQuery: BASiteQuery,
  eventName: string,
): Promise<EventPropertiesOverview> {
  const rawPropertyData = await getEventPropertyData(siteQuery, eventName);

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
