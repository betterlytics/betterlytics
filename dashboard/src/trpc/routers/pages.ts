import { z } from 'zod';
import { createRouter, analyticsProcedure } from '@/trpc/init';
import {
  getPageAnalytics,
  getEntryPageAnalyticsForSite,
  getExitPageAnalyticsForSite,
  getPagesSummaryWithChartsForSite,
  getPageTrafficForTimePeriod,
} from '@/services/analytics/pages.service';
import { toDataTable } from '@/presenters/toDataTable';
import { toSparklineSeries } from '@/presenters/toAreaChart';
import { toPartialPercentageCompare } from '@/presenters/toPartialPercentageCompare';

export const pagesRouter = createRouter({
  pageAnalytics: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getPageAnalytics(main),
      compare && getPageAnalytics(compare),
    ]);
    return toDataTable({ data, compare: compareData, categoryKey: 'path' });
  }),

  entryPageAnalytics: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getEntryPageAnalyticsForSite(main),
      compare && getEntryPageAnalyticsForSite(compare),
    ]);
    return toDataTable({ data, compare: compareData, categoryKey: 'path' });
  }),

  exitPageAnalytics: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getExitPageAnalyticsForSite(main),
      compare && getExitPageAnalyticsForSite(compare),
    ]);
    return toDataTable({ data, compare: compareData, categoryKey: 'path' });
  }),

  summaryWithCharts: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getPagesSummaryWithChartsForSite(main),
      compare && getPagesSummaryWithChartsForSite(compare),
    ]);
    const compareValues = toPartialPercentageCompare({
      data, compare: compareData,
      keys: ['pagesPerSession', 'totalPageviews', 'avgTimeOnPage', 'avgBounceRate'] as const,
    });
    const dateRange = { start: main.startDate, end: main.endDate };
    return {
      ...data,
      pagesPerSessionChartData: toSparklineSeries({ data: data.pagesPerSessionChartData, granularity: main.granularity, dataKey: 'value', dateRange }),
      avgTimeChartData: toSparklineSeries({ data: data.avgTimeChartData, granularity: main.granularity, dataKey: 'value', dateRange }),
      bounceRateChartData: toSparklineSeries({ data: data.bounceRateChartData, granularity: main.granularity, dataKey: 'value', dateRange }),
      pageviewsChartData: toSparklineSeries({ data: data.pageviewsChartData, granularity: main.granularity, dataKey: 'views', dateRange }),
      compareValues,
    };
  }),

  pageTrafficTimeSeries: analyticsProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      return getPageTrafficForTimePeriod(main, input.path);
    }),
});
