'server-only';

import {
  getDeviceTypeBreakdown,
  getBrowserBreakdown,
  getOperatingSystemBreakdown,
  getDeviceUsageTrend,
  getBrowserRollup,
  getOperatingSystemRollup,
} from '@/repositories/clickhouse/devices';
import { toDateTimeString } from '@/utils/dateFormatters';
import {
  DeviceType,
  BrowserStats,
  BrowserStatsSchema,
  OperatingSystemStats,
  OperatingSystemStatsSchema,
  DeviceUsageTrendRow,
} from '@/entities/devices';
import { getDeviceLabel } from '@/constants/deviceTypes';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/filter';

export async function getDeviceTypeBreakdownForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
): Promise<DeviceType[]> {
  return getDeviceTypeBreakdown(siteId, toDateTimeString(startDate), toDateTimeString(endDate), queryFilters);
}

export async function getBrowserBreakdownForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
): Promise<BrowserStats[]> {
  const browserData = await getBrowserBreakdown(
    siteId,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
    queryFilters,
  );

  // Calculate total visitors for percentage calculation
  const totalVisitors = browserData.reduce((sum, item) => sum + item.visitors, 0);

  const statsWithPercentages = browserData.map((item) => ({
    browser: item.browser,
    visitors: item.visitors,
    percentage: totalVisitors > 0 ? Math.round((item.visitors / totalVisitors) * 100) : 0,
  }));

  return BrowserStatsSchema.array().parse(statsWithPercentages);
}

export async function getBrowserRollupForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
) {
  return getBrowserRollup(siteId, toDateTimeString(startDate), toDateTimeString(endDate), queryFilters);
}

export async function getOperatingSystemRollupForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
) {
  return getOperatingSystemRollup(siteId, toDateTimeString(startDate), toDateTimeString(endDate), queryFilters);
}

export async function getOperatingSystemBreakdownForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
): Promise<OperatingSystemStats[]> {
  const osData = await getOperatingSystemBreakdown(
    siteId,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
    queryFilters,
  );

  const totalVisitors = osData.reduce((sum, item) => sum + item.visitors, 0);

  const statsWithPercentages = osData.map((item) => ({
    os: item.os,
    visitors: item.visitors,
    percentage: totalVisitors > 0 ? Math.round((item.visitors / totalVisitors) * 100) : 0,
  }));

  return OperatingSystemStatsSchema.array().parse(statsWithPercentages);
}

export async function getDeviceUsageTrendForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
): Promise<DeviceUsageTrendRow[]> {
  return getDeviceUsageTrend(
    siteId,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
    granularity,
    queryFilters,
  );
}

// Helper to find top item and calculate percentage from a breakdown list
const calculateTopItem = <T extends { visitors: number }>(breakdown: T[], nameKey: keyof T) => {
  if (breakdown.length === 0) {
    return { name: 'None', visitors: 0, percentage: 0 };
  }

  const totalVisitorsInCategory = breakdown.reduce((sum, item) => sum + item.visitors, 0);

  const topItem = breakdown.reduce((max, item) => (item.visitors > max.visitors ? item : max), breakdown[0]);

  const percentage =
    totalVisitorsInCategory > 0 ? Math.round((topItem.visitors / totalVisitorsInCategory) * 100) : 0;

  let name = String(topItem[nameKey]);
  if (nameKey === 'device_type') {
    name = getDeviceLabel(name);
  }

  return {
    name: name,
    visitors: topItem.visitors,
    percentage,
  };
};
