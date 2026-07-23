import { createRouter, analyticsProcedure } from '@/trpc/init';
import {
  getBrowserRollupForSite,
  getOperatingSystemRollupForSite,
  getDeviceTypeBreakdownForSite,
  getBrowserBreakdownForSite,
  getOperatingSystemBreakdownForSite,
  getDeviceUsageTrendForSite,
} from '@/services/analytics/devices.service';
import { toHierarchicalDataTable } from '@/presenters/toHierarchicalDataTable';
import { toDataTable } from '@/presenters/toDataTable';
import { toFormatted } from '@/presenters/toFormatted';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { toPieChart } from '@/presenters/toPieChart';
import { getSortedCategories, toStackedAreaChart } from '@/presenters/toStackedAreaChart';

export const devicesRouter = createRouter({
  browserRollup: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getBrowserRollupForSite(main),
      compare && getBrowserRollupForSite(compare),
    ]);
    return toHierarchicalDataTable({
      data,
      compare: compareData || undefined,
      parentKey: 'browser',
      childKey: 'version',
    }).slice(0, 10);
  }),

  osRollup: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getOperatingSystemRollupForSite(main),
      compare && getOperatingSystemRollupForSite(compare),
    ]);
    return toHierarchicalDataTable({
      data,
      compare: compareData || undefined,
      parentKey: 'os',
      childKey: 'version',
    }).slice(0, 10);
  }),

  deviceType: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getDeviceTypeBreakdownForSite(main),
      compare && getDeviceTypeBreakdownForSite(compare),
    ]);
    return toDataTable({
      data: toFormatted(data, (value) => ({ ...value, device_type: capitalizeFirstLetter(value.device_type) })),
      compare: toFormatted(compareData, (value) => ({ ...value, device_type: capitalizeFirstLetter(value.device_type) })),
      categoryKey: 'device_type',
    }).slice(0, 10);
  }),

  deviceTypeBreakdown: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getDeviceTypeBreakdownForSite(main),
      compare && getDeviceTypeBreakdownForSite(compare),
    ]);
    return toPieChart({
      key: 'device_type',
      dataKey: 'visitors',
      data: toFormatted(data, (value) => ({ ...value, device_type: capitalizeFirstLetter(value.device_type) })),
      compare: toFormatted(compareData, (value) => ({ ...value, device_type: capitalizeFirstLetter(value.device_type) })),
    });
  }),

  usageTrend: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [rawData, compareRawData] = await Promise.all([
      getDeviceUsageTrendForSite(main),
      compare && getDeviceUsageTrendForSite(compare),
    ]);
    const data = toFormatted(rawData, (value) => ({ ...value, device_type: capitalizeFirstLetter(value.device_type) }));
    const sortedCategories = getSortedCategories(data, 'device_type', 'count');
    return toStackedAreaChart({
      data,
      categoryKey: 'device_type',
      valueKey: 'count',
      categories: sortedCategories,
      granularity: main.granularity,
      dateRange: { start: main.startDate, end: main.endDate },
      compare: toFormatted(compareRawData, (value) => ({ ...value, device_type: capitalizeFirstLetter(value.device_type) })),
      compareDateRange: compare ? { start: compare.startDate, end: compare.endDate } : undefined,
    });
  }),

  browserBreakdown: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getBrowserBreakdownForSite(main),
      compare && getBrowserBreakdownForSite(compare),
    ]);
    return toDataTable({ data, compare: compareData, categoryKey: 'browser' });
  }),

  osBreakdown: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getOperatingSystemBreakdownForSite(main),
      compare && getOperatingSystemBreakdownForSite(compare),
    ]);
    return toDataTable({ data, compare: compareData, categoryKey: 'os' });
  }),
});
