'use server';

import {
  getDeviceTypeBreakdownForSite,
  getBrowserBreakdownForSite,
  getDeviceSummaryForSite,
  getOperatingSystemBreakdownForSite,
  getDeviceUsageTrendForSite,
} from '@/services/devices';
import {
  DeviceType,
  BrowserStats,
  DeviceSummary,
  OperatingSystemStats,
  DeviceUsageTrendRow,
  DeviceBreakdownCombined,
  DeviceBreakdownCombinedSchema,
} from '@/entities/devices';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/filter';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { toPieChart } from '@/presenters/toPieChart';
import { toStackedChart } from '@/presenters/toStackedChart';

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
  ): Promise<DeviceBreakdownCombined> => {
    const [deviceTypeBreakdown, browserBreakdown, operatingSystemBreakdown] = await Promise.all([
      getDeviceTypeBreakdownForSite(ctx.siteId, startDate, endDate, queryFilters),
      getBrowserBreakdownForSite(ctx.siteId, startDate, endDate, queryFilters),
      getOperatingSystemBreakdownForSite(ctx.siteId, startDate, endDate, queryFilters),
    ]);

    return DeviceBreakdownCombinedSchema.parse({
      devices: deviceTypeBreakdown,
      browsers: browserBreakdown,
      operatingSystems: operatingSystemBreakdown,
    });
  },
);

export const fetchDeviceSummaryAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
  ): Promise<DeviceSummary> => {
    return getDeviceSummaryForSite(ctx.siteId, startDate, endDate, queryFilters);
  },
);

export const fetchBrowserBreakdownAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
  ): Promise<BrowserStats[]> => {
    return getBrowserBreakdownForSite(ctx.siteId, startDate, endDate, queryFilters);
  },
);

export const fetchOperatingSystemBreakdownAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
  ): Promise<OperatingSystemStats[]> => {
    return getOperatingSystemBreakdownForSite(ctx.siteId, startDate, endDate, queryFilters);
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
    const data = await getDeviceUsageTrendForSite(ctx.siteId, startDate, endDate, granularity, queryFilters);

    const compare =
      compareStartDate &&
      compareEndDate &&
      (await getDeviceUsageTrendForSite(ctx.siteId, compareStartDate, compareEndDate, granularity, queryFilters));

    return toStackedChart({
      data,
      key: 'device_type',
      dataKey: 'count',
      granularity,
      compare,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      compareDateRange: {
        start: compareStartDate,
        end: compareEndDate,
      },
    });
  },
);
