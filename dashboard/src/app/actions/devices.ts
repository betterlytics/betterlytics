'use server';

import {
  getDeviceTypeBreakdownForSite,
  getBrowserBreakdownForSite,
  getOperatingSystemBreakdownForSite,
  getDeviceUsageTrendForSite,
} from '@/services/devices';
import { BrowserStats, DeviceBreakdownCombinedSchema } from '@/entities/devices';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/filter';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { toPieChart } from '@/presenters/toPieChart';
import { toStackedAreaChart, getSortedCategories } from '@/presenters/toStackedAreaChart';
import { ToDataTable, toDataTable } from '@/presenters/toDataTable';

export const fetchDeviceTypeBreakdownAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getDeviceTypeBreakdownForSite(ctx.siteId, startDate, endDate, queryFilters);

    const compare =
      compareStartDate &&
      compareEndDate &&
      (await getDeviceTypeBreakdownForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters));

    return toPieChart({
      key: 'device_type',
      dataKey: 'visitors',
      data,
      compare,
    });
  },
);

export const fetchDeviceBreakdownCombinedAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const [
      deviceTypeBreakdown,
      compareDeviceTypeBreakdown,
      browserBreakdown,
      compareBrowserBreakdown,
      operatingSystemBreakdown,
      compareOperatingSystemBreakdown,
    ] = await Promise.all([
      getDeviceTypeBreakdownForSite(ctx.siteId, startDate, endDate, queryFilters),
      compareStartDate &&
        compareEndDate &&
        getDeviceTypeBreakdownForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters),
      getBrowserBreakdownForSite(ctx.siteId, startDate, endDate, queryFilters),
      compareStartDate &&
        compareEndDate &&
        getBrowserBreakdownForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters),
      getOperatingSystemBreakdownForSite(ctx.siteId, startDate, endDate, queryFilters),
      compareStartDate &&
        compareEndDate &&
        getOperatingSystemBreakdownForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters),
    ]);

    const data = DeviceBreakdownCombinedSchema.parse({
      devices: deviceTypeBreakdown,
      browsers: browserBreakdown,
      operatingSystems: operatingSystemBreakdown,
    });

    const compare =
      compareStartDate &&
      compareEndDate &&
      DeviceBreakdownCombinedSchema.parse({
        devices: compareDeviceTypeBreakdown,
        browsers: compareBrowserBreakdown,
        operatingSystems: compareOperatingSystemBreakdown,
      });

    return {
      devices: toDataTable({
        data: data.devices,
        compare: compare?.devices,
        categoryKey: 'device_type',
      }),
      browsers: toDataTable({
        data: data.browsers,
        compare: compare?.browsers,
        categoryKey: 'browser',
      }),
      operatingSystems: toDataTable({
        data: data.operatingSystems,
        compare: compare?.operatingSystems,
        categoryKey: 'os',
      }),
    };
  },
);

export const fetchBrowserBreakdownAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ): Promise<ToDataTable<'browser', BrowserStats>[]> => {
    const data = await getBrowserBreakdownForSite(ctx.siteId, startDate, endDate, queryFilters);
    const compareData =
      compareStartDate &&
      compareEndDate &&
      (await getBrowserBreakdownForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters));

    return toDataTable({ data, compare: compareData, categoryKey: 'browser' });
  },
);

export const fetchOperatingSystemBreakdownAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getOperatingSystemBreakdownForSite(ctx.siteId, startDate, endDate, queryFilters);
    const compareData =
      compareStartDate &&
      compareEndDate &&
      (await getOperatingSystemBreakdownForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters));

    return toDataTable({ data, compare: compareData, categoryKey: 'os' });
  },
);

export const fetchDeviceUsageTrendAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const rawData = await getDeviceUsageTrendForSite(ctx.siteId, startDate, endDate, granularity, queryFilters);

    const compareData =
      compareStartDate &&
      compareEndDate &&
      (await getDeviceUsageTrendForSite(ctx.siteId, compareStartDate, compareEndDate, granularity, queryFilters));

    const sortedCategories = getSortedCategories(rawData, 'device_type', 'count');

    const result = toStackedAreaChart({
      data: rawData,
      categoryKey: 'device_type',
      valueKey: 'count',
      categories: sortedCategories,
      granularity,
      dateRange: { start: startDate, end: endDate },
      compare: compareData,
      compareDateRange:
        compareStartDate && compareEndDate ? { start: compareStartDate, end: compareEndDate } : undefined,
    });

    return result;
  },
);
