'use server';

import { TopEntryPageRow, TopExitPageRow, PageAnalyticsCombinedSchema } from '@/entities/analytics/pages.entities';
import {
  getTopPagesForSite,
  getTotalPageViewsForSite,
  getTopEntryPagesForSite,
  getTopExitPagesForSite,
} from '@/services/analytics/pages.service';
import { getSummaryStatsWithChartsForSite } from '@/services/analytics/visitors.service';
import { getUniqueVisitorsForSite } from '@/services/analytics/visitors.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { getSessionMetrics } from '@/repositories/clickhouse/index.repository';
import { toAreaChart, toSparklineSeries } from '@/presenters/toAreaChart';
import { toDataTable } from '@/presenters/toDataTable';
import { toPartialPercentageCompare } from '@/presenters/toPartialPercentageCompare';
import { isStartBucketIncomplete, isEndBucketIncomplete } from '@/lib/ba-timerange';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export const fetchTotalPageViewsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getTotalPageViewsForSite(main);
    const compareData = compare && (await getTotalPageViewsForSite(compare));

    return toAreaChart({
      data,
      granularity: main.granularity,
      dataKey: 'views',
      dateRange: { start: main.startDate, end: main.endDate },
      compare: compareData,
      compareDateRange: compare ? { start: compare.startDate, end: compare.endDate } : undefined,
      bucketIncomplete:
        main.endDate.getTime() > Date.now() || isEndBucketIncomplete(main.endDate, main.granularity, main.timezone),
      startBucketIncomplete: isStartBucketIncomplete(main.startDate, main.granularity, main.timezone),
    });
  },
);

export const fetchUniqueVisitorsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getUniqueVisitorsForSite(main);
    const compareData = compare && (await getUniqueVisitorsForSite(compare));

    return toAreaChart({
      data,
      granularity: main.granularity,
      dataKey: 'unique_visitors',
      dateRange: { start: main.startDate, end: main.endDate },
      compare: compareData,
      compareDateRange: compare ? { start: compare.startDate, end: compare.endDate } : undefined,
      bucketIncomplete:
        main.endDate.getTime() > Date.now() || isEndBucketIncomplete(main.endDate, main.granularity, main.timezone),
      startBucketIncomplete: isStartBucketIncomplete(main.startDate, main.granularity, main.timezone),
    });
  },
);

export const fetchSummaryStatsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getSummaryStatsWithChartsForSite(main);
    const compareData = compare && (await getSummaryStatsWithChartsForSite(compare));

    const compareValues = toPartialPercentageCompare({
      data,
      compare: compareData,
      keys: [
        'uniqueVisitors',
        'pageviews',
        'sessions',
        'pagesPerSession',
        'avgVisitDuration',
        'bounceRate',
      ] as const,
    });

    const dateRange = { start: main.startDate, end: main.endDate };

    return {
      ...data,
      visitorsChartData: toSparklineSeries({
        data: data.visitorsChartData,
        granularity: main.granularity,
        dataKey: 'unique_visitors',
        dateRange,
      }),
      pageviewsChartData: toSparklineSeries({
        data: data.pageviewsChartData,
        granularity: main.granularity,
        dataKey: 'views',
        dateRange,
      }),
      sessionsChartData: toSparklineSeries({
        data: data.sessionsChartData,
        granularity: main.granularity,
        dataKey: 'sessions',
        dateRange,
      }),
      bounceRateChartData: toSparklineSeries({
        data: data.bounceRateChartData,
        granularity: main.granularity,
        dataKey: 'bounce_rate',
        dateRange,
      }),
      avgVisitDurationChartData: toSparklineSeries({
        data: data.avgVisitDurationChartData,
        granularity: main.granularity,
        dataKey: 'avg_visit_duration',
        dateRange,
      }),
      pagesPerSessionChartData: toSparklineSeries({
        data: data.pagesPerSessionChartData,
        granularity: main.granularity,
        dataKey: 'pages_per_session',
        dateRange,
      }),
      compareValues,
    };
  },
);

export const fetchSessionMetricsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getSessionMetrics(main);
    const compareData = compare && (await getSessionMetrics(compare));

    const startIncomplete = isStartBucketIncomplete(main.startDate, main.granularity, main.timezone);

    return {
      avgVisitDuration: toAreaChart({
        data,
        granularity: main.granularity,
        dataKey: 'avg_visit_duration',
        dateRange: { start: main.startDate, end: main.endDate },
        compare: compareData,
        compareDateRange: compare ? { start: compare.startDate, end: compare.endDate } : undefined,
        bucketIncomplete:
          main.endDate.getTime() > Date.now() || isEndBucketIncomplete(main.endDate, main.granularity, main.timezone),
        startBucketIncomplete: startIncomplete,
      }),
      bounceRate: toAreaChart({
        data,
        granularity: main.granularity,
        dataKey: 'bounce_rate',
        dateRange: { start: main.startDate, end: main.endDate },
        compare: compareData,
        compareDateRange: compare ? { start: compare.startDate, end: compare.endDate } : undefined,
        bucketIncomplete:
          main.endDate.getTime() > Date.now() || isEndBucketIncomplete(main.endDate, main.granularity, main.timezone),
        startBucketIncomplete: startIncomplete,
      }),
      pagesPerSession: toAreaChart({
        data,
        granularity: main.granularity,
        dataKey: 'pages_per_session',
        dateRange: { start: main.startDate, end: main.endDate },
        compare: compareData,
        compareDateRange: compare ? { start: compare.startDate, end: compare.endDate } : undefined,
        bucketIncomplete:
          main.endDate.getTime() > Date.now() || isEndBucketIncomplete(main.endDate, main.granularity, main.timezone),
        startBucketIncomplete: startIncomplete,
      }),
      sessions: toAreaChart({
        data,
        granularity: main.granularity,
        dataKey: 'sessions',
        dateRange: { start: main.startDate, end: main.endDate },
        compare: compareData,
        compareDateRange: compare ? { start: compare.startDate, end: compare.endDate } : undefined,
        bucketIncomplete:
          main.endDate.getTime() > Date.now() || isEndBucketIncomplete(main.endDate, main.granularity, main.timezone),
        startBucketIncomplete: startIncomplete,
      }),
    };
  },
);

export const fetchTopEntryPagesAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, limit: number): Promise<TopEntryPageRow[]> => {
    const { main } = toSiteQuery(ctx.siteId, query);
    return getTopEntryPagesForSite(main, limit);
  },
);

export const fetchTopExitPagesAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, limit: number): Promise<TopExitPageRow[]> => {
    const { main } = toSiteQuery(ctx.siteId, query);
    return getTopExitPagesForSite(main, limit);
  },
);

export const fetchPageAnalyticsCombinedAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, limit: number = 5) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const [topPages, topPagesCompare, topEntryPages, topEntryPagesCompare, topExitPages, topExitPagesCompare] =
      await Promise.all([
        getTopPagesForSite(main, limit),
        compare && getTopPagesForSite(compare, limit),
        getTopEntryPagesForSite(main, limit),
        compare && getTopEntryPagesForSite(compare, limit),
        getTopExitPagesForSite(main, limit),
        compare && getTopExitPagesForSite(compare, limit),
      ]);

    const data = PageAnalyticsCombinedSchema.parse({
      topPages,
      topEntryPages,
      topExitPages,
    });

    const compareData =
      compare &&
      PageAnalyticsCombinedSchema.parse({
        topPages: topPagesCompare,
        topEntryPages: topEntryPagesCompare,
        topExitPages: topExitPagesCompare,
      });

    return {
      topPages: toDataTable({
        data: data.topPages,
        compare: compareData?.topPages,
        categoryKey: 'url',
      }),
      topEntryPages: toDataTable({
        data: data.topEntryPages,
        compare: compareData?.topEntryPages,
        categoryKey: 'url',
      }),
      topExitPages: toDataTable({
        data: data.topExitPages,
        compare: compareData?.topExitPages,
        categoryKey: 'url',
      }),
    };
  },
);
