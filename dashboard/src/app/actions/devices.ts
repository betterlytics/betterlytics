'use server';

import {
  getDeviceTypeBreakdownForSite,
  getBrowserBreakdownForSite,
  getOperatingSystemBreakdownForSite,
  getDeviceUsageTrendForSite,
  getBrowserRollupForSite,
  getOperatingSystemRollupForSite,
} from '@/services/devices';
import { BrowserStats, DeviceBreakdownCombinedSchema } from '@/entities/devices';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/filter';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { toPieChart } from '@/presenters/toPieChart';
import { toStackedAreaChart, getSortedCategories } from '@/presenters/toStackedAreaChart';
import { ToDataTable, toDataTable } from '@/presenters/toDataTable';
import { toFormatted } from '@/presenters/toFormatted';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { toHierarchicalDataTable } from '@/presenters/toHierarchicalDataTable';
import { TimeRangeValue } from '@/utils/timeRanges';

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
      data: toFormatted(data, (value) => ({ ...value, device_type: capitalizeFirstLetter(value.device_type) })),
      compare: toFormatted(compare, (value) => ({
        ...value,
        device_type: capitalizeFirstLetter(value.device_type),
      })),
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
      browserRollup,
      compareBrowserRollup,
      operatingSystemRollup,
      compareOperatingSystemRollup,
    ] = await Promise.all([
      getDeviceTypeBreakdownForSite(ctx.siteId, startDate, endDate, queryFilters),
      compareStartDate &&
        compareEndDate &&
        getDeviceTypeBreakdownForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters),
      getBrowserRollupForSite(ctx.siteId, startDate, endDate, queryFilters),
      compareStartDate &&
        compareEndDate &&
        getBrowserRollupForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters),
      getOperatingSystemRollupForSite(ctx.siteId, startDate, endDate, queryFilters),
      compareStartDate &&
        compareEndDate &&
        getOperatingSystemRollupForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters),
    ]);

    const data = DeviceBreakdownCombinedSchema.parse({
      devices: toFormatted(deviceTypeBreakdown, (value) => ({
        ...value,
        device_type: capitalizeFirstLetter(value.device_type),
      })),
      browsersRollup: browserRollup,
      operatingSystemsRollup: operatingSystemRollup,
    });

    const compare =
      compareStartDate &&
      compareEndDate &&
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
        compare: toFormatted(compare?.devices, (value) => ({
          ...value,
          device_type: capitalizeFirstLetter(value.device_type),
        })),
        categoryKey: 'device_type',
      }).slice(0, 10),
      browsersExpanded: toHierarchicalDataTable({
        data: data.browsersRollup,
        compare: compare?.browsersRollup,
        parentKey: 'browser',
        childKey: 'version',
      }).slice(0, 10),
      operatingSystemsExpanded: toHierarchicalDataTable({
        data: data.operatingSystemsRollup,
        compare: compare?.operatingSystemsRollup,
        parentKey: 'os',
        childKey: 'version',
      }).slice(0, 10),
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
    timezone: string,
    interval: TimeRangeValue,
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const rawData = await getDeviceUsageTrendForSite(
      ctx.siteId,
      startDate,
      endDate,
      granularity,
      queryFilters,
      timezone,
      interval,
    );

    const data = toFormatted(rawData, (value) => ({
      ...value,
      device_type: capitalizeFirstLetter(value.device_type),
    }));

    const compareData =
      compareStartDate &&
      compareEndDate &&
      (await getDeviceUsageTrendForSite(
        ctx.siteId,
        compareStartDate,
        compareEndDate,
        granularity,
        queryFilters,
        timezone,
        interval,
      ));

    const sortedCategories = getSortedCategories(data, 'device_type', 'count');

    const result = toStackedAreaChart({
      data,
      categoryKey: 'device_type',
      valueKey: 'count',
      categories: sortedCategories,
      granularity,
      dateRange: { start: startDate, end: endDate },
      timezone,
      compare: toFormatted(compareData, (value) => ({
        ...value,
        device_type: capitalizeFirstLetter(value.device_type),
      })),
      compareDateRange:
        compareStartDate && compareEndDate ? { start: compareStartDate, end: compareEndDate } : undefined,
    });

    return result;
  },
);
