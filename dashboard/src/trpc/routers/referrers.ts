import { createRouter, analyticsProcedure } from '@/trpc/init';
import {
  getReferrerSourceAggregationDataForSite,
  getReferrerTrafficTrendBySourceDataForSite,
  getReferrerSummaryWithChartsForSite,
  getReferrerTableDataForSite,
  getReferrerUrlRollupForSite,
  getTopChannelsForSite,
} from '@/services/analytics/referrers.service';
import { toPieChart } from '@/presenters/toPieChart';
import { getSortedCategories, toStackedAreaChart } from '@/presenters/toStackedAreaChart';
import { toDataTable } from '@/presenters/toDataTable';
import { toHierarchicalDataTable } from '@/presenters/toHierarchicalDataTable';
import { toSparklineSeries } from '@/presenters/toAreaChart';

const TOP_REFERRERS_LIMIT = 10;
const REFERRER_TABLE_LIMIT = 100;

export const referrersRouter = createRouter({
  referrerUrlRollup: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getReferrerUrlRollupForSite(main, TOP_REFERRERS_LIMIT),
      compare && getReferrerUrlRollupForSite(compare, TOP_REFERRERS_LIMIT),
    ]);
    return toHierarchicalDataTable({
      data,
      compare: compareData || undefined,
      parentKey: 'source_name',
      childKey: 'referrer_url',
    });
  }),

  topChannels: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getTopChannelsForSite(main, TOP_REFERRERS_LIMIT),
      compare && getTopChannelsForSite(compare, TOP_REFERRERS_LIMIT),
    ]);
    return toDataTable({ data, compare: compareData || undefined, categoryKey: 'channel' });
  }),

  sourceAggregation: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getReferrerSourceAggregationDataForSite(main),
      compare && getReferrerSourceAggregationDataForSite(compare),
    ]);
    return toPieChart({ data, key: 'referrer_source', dataKey: 'visitorCount', compare: compareData });
  }),

  trafficTrend: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [rawData, compareData] = await Promise.all([
      getReferrerTrafficTrendBySourceDataForSite(main),
      compare && getReferrerTrafficTrendBySourceDataForSite(compare),
    ]);
    const sortedCategories = getSortedCategories(rawData, 'referrer_source', 'count');
    return toStackedAreaChart({
      data: rawData,
      categoryKey: 'referrer_source',
      valueKey: 'count',
      categories: sortedCategories,
      granularity: main.granularity,
      dateRange: { start: main.startDate, end: main.endDate },
      compare: compareData,
      compareDateRange: compare ? { start: compare.startDate, end: compare.endDate } : undefined,
    });
  }),

  summary: analyticsProcedure.query(async ({ ctx }) => {
    const { main } = ctx;
    const raw = await getReferrerSummaryWithChartsForSite(main);
    const dateRange = { start: main.startDate, end: main.endDate };
    return {
      ...raw,
      referralSessionsChartData: toSparklineSeries({
        data: raw.referralSessionsChartData,
        granularity: main.granularity,
        dataKey: 'referralSessions',
        dateRange,
      }),
      referralPercentageChartData: toSparklineSeries({
        data: raw.referralPercentageChartData,
        granularity: main.granularity,
        dataKey: 'referralPercentage',
        dateRange,
      }),
      avgSessionDurationChartData: toSparklineSeries({
        data: raw.avgSessionDurationChartData,
        granularity: main.granularity,
        dataKey: 'avgSessionDuration',
        dateRange,
      }),
    };
  }),

  table: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getReferrerTableDataForSite(main, REFERRER_TABLE_LIMIT),
      compare && getReferrerTableDataForSite(compare, REFERRER_TABLE_LIMIT),
    ]);
    return toDataTable({ data, compare: compareData, categoryKey: 'source_url' });
  }),
});
