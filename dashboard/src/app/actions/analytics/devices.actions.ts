'use server';

import {
  getDeviceTypeBreakdownForSite,
  getBrowserBreakdownForSite,
  getOperatingSystemBreakdownForSite,
  getDeviceUsageTrendForSite,
  getBrowserRollupForSite,
  getOperatingSystemRollupForSite,
} from '@/services/analytics/devices.service';
import { BrowserStats, DeviceBreakdownCombinedSchema } from '@/entities/analytics/devices.entities';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { toPieChart } from '@/presenters/toPieChart';
import { getSortedCategories, toStackedAreaChart } from '@/presenters/toStackedAreaChart';
import { ToDataTable, toDataTable } from '@/presenters/toDataTable';
import { toFormatted } from '@/presenters/toFormatted';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { toHierarchicalDataTable } from '@/presenters/toHierarchicalDataTable';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export const fetchDeviceTypeBreakdownAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getDeviceTypeBreakdownForSite(main);
    const compareData = compare && (await getDeviceTypeBreakdownForSite(compare));

    return toPieChart({
      key: 'device_type',
      dataKey: 'visitors',
      data: toFormatted(data, (value) => ({ ...value, device_type: capitalizeFirstLetter(value.device_type) })),
      compare: toFormatted(compareData, (value) => ({
        ...value,
        device_type: capitalizeFirstLetter(value.device_type),
      })),
    });
  },
);

export const fetchDeviceBreakdownCombinedAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const [
      deviceTypeBreakdown,
      compareDeviceTypeBreakdown,
      browserRollup,
      compareBrowserRollup,
      operatingSystemRollup,
      compareOperatingSystemRollup,
    ] = await Promise.all([
      getDeviceTypeBreakdownForSite(main),
      compare && getDeviceTypeBreakdownForSite(compare),
      getBrowserRollupForSite(main),
      compare && getBrowserRollupForSite(compare),
      getOperatingSystemRollupForSite(main),
      compare && getOperatingSystemRollupForSite(compare),
    ]);

    const data = DeviceBreakdownCombinedSchema.parse({
      devices: toFormatted(deviceTypeBreakdown, (value) => ({
        ...value,
        device_type: capitalizeFirstLetter(value.device_type),
      })),
      browsersRollup: browserRollup,
      operatingSystemsRollup: operatingSystemRollup,
    });

    const compareData =
      compare &&
      DeviceBreakdownCombinedSchema.parse({
        devices: toFormatted(compareDeviceTypeBreakdown, (value) => ({
          ...value,
          device_type: capitalizeFirstLetter(value.device_type),
        })),
        browsersRollup: compareBrowserRollup,
        operatingSystemsRollup: compareOperatingSystemRollup,
      });

    return {
      devices: toDataTable({
        data: toFormatted(data.devices, (value) => ({
          ...value,
          device_type: capitalizeFirstLetter(value.device_type),
        })),
        compare: toFormatted(compareData?.devices, (value) => ({
          ...value,
          device_type: capitalizeFirstLetter(value.device_type),
        })),
        categoryKey: 'device_type',
      }).slice(0, 10),
      browsersExpanded: toHierarchicalDataTable({
        data: data.browsersRollup,
        compare: compareData?.browsersRollup,
        parentKey: 'browser',
        childKey: 'version',
      }).slice(0, 10),
      operatingSystemsExpanded: toHierarchicalDataTable({
        data: data.operatingSystemsRollup,
        compare: compareData?.operatingSystemsRollup,
        parentKey: 'os',
        childKey: 'version',
      }).slice(0, 10),
    };
  },
);

export const fetchBrowserBreakdownAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery): Promise<ToDataTable<'browser', BrowserStats>[]> => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getBrowserBreakdownForSite(main);
    const compareData = compare && (await getBrowserBreakdownForSite(compare));

    return toDataTable({ data, compare: compareData, categoryKey: 'browser' });
  },
);

export const fetchOperatingSystemBreakdownAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getOperatingSystemBreakdownForSite(main);
    const compareData = compare && (await getOperatingSystemBreakdownForSite(compare));

    return toDataTable({ data, compare: compareData, categoryKey: 'os' });
  },
);

export const fetchDeviceUsageTrendAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const rawData = await getDeviceUsageTrendForSite(main);

    const data = toFormatted(rawData, (value) => ({
      ...value,
      device_type: capitalizeFirstLetter(value.device_type),
    }));

    const compareRawData = compare && (await getDeviceUsageTrendForSite(compare));

    const sortedCategories = getSortedCategories(data, 'device_type', 'count');

    return toStackedAreaChart({
      data,
      categoryKey: 'device_type',
      valueKey: 'count',
      categories: sortedCategories,
      granularity: main.granularity,
      dateRange: { start: main.startDate, end: main.endDate },
      compare: toFormatted(compareRawData, (value) => ({
        ...value,
        device_type: capitalizeFirstLetter(value.device_type),
      })),
      compareDateRange: compare ? { start: compare.startDate, end: compare.endDate } : undefined,
    });
  },
);
