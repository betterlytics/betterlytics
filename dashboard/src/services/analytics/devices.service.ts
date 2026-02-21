'server-only';

import {
  getDeviceTypeBreakdown,
  getBrowserBreakdown,
  getOperatingSystemBreakdown,
  getDeviceUsageTrend,
  getBrowserRollup,
  getOperatingSystemRollup,
} from '@/repositories/clickhouse/devices.repository';
import {
  DeviceType,
  BrowserStats,
  BrowserStatsSchema,
  OperatingSystemStats,
  OperatingSystemStatsSchema,
  DeviceUsageTrendRow,
} from '@/entities/analytics/devices.entities';
import { getDeviceLabel } from '@/constants/deviceTypes';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getDeviceTypeBreakdownForSite(siteQuery: BASiteQuery): Promise<DeviceType[]> {
  return getDeviceTypeBreakdown(siteQuery);
}

export async function getBrowserBreakdownForSite(siteQuery: BASiteQuery): Promise<BrowserStats[]> {
  const browserData = await getBrowserBreakdown(siteQuery);

  const totalVisitors = browserData.reduce((sum, item) => sum + item.visitors, 0);

  const statsWithPercentages = browserData.map((item) => ({
    browser: item.browser,
    visitors: item.visitors,
    percentage: totalVisitors > 0 ? Math.round((item.visitors / totalVisitors) * 100) : 0,
  }));

  return BrowserStatsSchema.array().parse(statsWithPercentages);
}

export async function getBrowserRollupForSite(siteQuery: BASiteQuery) {
  return getBrowserRollup(siteQuery);
}

export async function getOperatingSystemRollupForSite(siteQuery: BASiteQuery) {
  return getOperatingSystemRollup(siteQuery);
}

export async function getOperatingSystemBreakdownForSite(siteQuery: BASiteQuery): Promise<OperatingSystemStats[]> {
  const osData = await getOperatingSystemBreakdown(siteQuery);

  const totalVisitors = osData.reduce((sum, item) => sum + item.visitors, 0);

  const statsWithPercentages = osData.map((item) => ({
    os: item.os,
    visitors: item.visitors,
    percentage: totalVisitors > 0 ? Math.round((item.visitors / totalVisitors) * 100) : 0,
  }));

  return OperatingSystemStatsSchema.array().parse(statsWithPercentages);
}

export async function getDeviceUsageTrendForSite(siteQuery: BASiteQuery): Promise<DeviceUsageTrendRow[]> {
  return getDeviceUsageTrend(siteQuery);
}

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
