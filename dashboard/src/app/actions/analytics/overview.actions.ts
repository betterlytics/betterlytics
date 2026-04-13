'use server';

import { PageAnalyticsCombinedSchema } from '@/entities/analytics/pages.entities';
import {
  getTopPagesForSite,
  getTotalPageViewsForSite,
  getTopEntryPagesForSite,
  getTopExitPagesForSite,
} from '@/services/analytics/pages.service';
import { getUniqueVisitorsForSite } from '@/services/analytics/visitors.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { getSessionMetrics, getSessionRangeMetrics } from '@/repositories/clickhouse/index.repository';
import { toAreaChart, toSparklineSeries } from '@/presenters/toAreaChart';
import { toDataTable } from '@/presenters/toDataTable';
import { toPartialPercentageCompare } from '@/presenters/toPartialPercentageCompare';
import { isStartBucketIncomplete, isEndBucketIncomplete } from '@/lib/ba-timerange';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

type RawVisitors = Awaited<ReturnType<typeof getUniqueVisitorsForSite>>;
type RawPageviews = Awaited<ReturnType<typeof getTotalPageViewsForSite>>;
type RawSessionRange = Awaited<ReturnType<typeof getSessionRangeMetrics>>;

function toAggregates(visitors: RawVisitors, pageviews: RawPageviews, range: RawSessionRange) {
  return {
    uniqueVisitors: visitors.reduce((sum, row) => sum + row.unique_visitors, 0),
    pageviews: pageviews.reduce((sum, row) => sum + row.views, 0),
    sessions: range.sessions,
    bounceRate: Math.round(range.bounce_rate),
    avgVisitDuration: Math.round(range.avg_visit_duration),
    pagesPerSession: Number(range.pages_per_session.toFixed(1)),
  };
}

export const fetchSummaryAndChartDataAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const [
      visitorsData,
      pageviewsData,
      sessionMetricsData,
      sessionRangeData,
      visitorsCompare,
      pageviewsCompare,
      sessionMetricsCompare,
      sessionRangeCompare,
    ] = await Promise.all([
      getUniqueVisitorsForSite(main),
      getTotalPageViewsForSite(main),
      getSessionMetrics(main),
      getSessionRangeMetrics(main),
      compare ? getUniqueVisitorsForSite(compare) : undefined,
      compare ? getTotalPageViewsForSite(compare) : undefined,
      compare ? getSessionMetrics(compare) : undefined,
      compare ? getSessionRangeMetrics(compare) : undefined,
    ]);

    const dateRange = { start: main.startDate, end: main.endDate };
    const compareDateRange = compare ? { start: compare.startDate, end: compare.endDate } : undefined;
    const bucketIncomplete =
      main.endDate.getTime() > Date.now() || isEndBucketIncomplete(main.endDate, main.granularity, main.timezone);
    const startBucketIncomplete = isStartBucketIncomplete(main.startDate, main.granularity, main.timezone);

    const summaryData = toAggregates(visitorsData, pageviewsData, sessionRangeData);
    const compareAggregates =
      visitorsCompare && pageviewsCompare && sessionRangeCompare
        ? toAggregates(visitorsCompare, pageviewsCompare, sessionRangeCompare)
        : undefined;

    const compareValues = toPartialPercentageCompare({
      data: summaryData,
      compare: compareAggregates,
      keys: [
        'uniqueVisitors',
        'pageviews',
        'sessions',
        'pagesPerSession',
        'avgVisitDuration',
        'bounceRate',
      ] as const,
    });

    const seriesBase = { granularity: main.granularity, dateRange };
    const sessionSeriesBase = { ...seriesBase, data: sessionMetricsData };
    const areaChartBase = { ...seriesBase, compareDateRange, bucketIncomplete, startBucketIncomplete };
    const sessionAreaChartBase = { ...areaChartBase, data: sessionMetricsData, compare: sessionMetricsCompare };

    return {
      ...summaryData,
      compareValues,
      visitorsChartData: toSparklineSeries({ ...seriesBase, data: visitorsData, dataKey: 'unique_visitors' }),
      pageviewsChartData: toSparklineSeries({ ...seriesBase, data: pageviewsData, dataKey: 'views' }),
      sessionsChartData: toSparklineSeries({ ...sessionSeriesBase, dataKey: 'sessions' }),
      bounceRateChartData: toSparklineSeries({ ...sessionSeriesBase, dataKey: 'bounce_rate' }),
      avgVisitDurationChartData: toSparklineSeries({ ...sessionSeriesBase, dataKey: 'avg_visit_duration' }),
      pagesPerSessionChartData: toSparklineSeries({ ...sessionSeriesBase, dataKey: 'pages_per_session' }),
      visitorsAreaChart: toAreaChart({
        ...areaChartBase,
        data: visitorsData,
        dataKey: 'unique_visitors',
        compare: visitorsCompare,
      }),
      pageviewsAreaChart: toAreaChart({
        ...areaChartBase,
        data: pageviewsData,
        dataKey: 'views',
        compare: pageviewsCompare,
      }),
      sessionMetrics: {
        sessions: toAreaChart({ ...sessionAreaChartBase, dataKey: 'sessions' }),
        bounceRate: toAreaChart({ ...sessionAreaChartBase, dataKey: 'bounce_rate' }),
        avgVisitDuration: toAreaChart({ ...sessionAreaChartBase, dataKey: 'avg_visit_duration' }),
        pagesPerSession: toAreaChart({ ...sessionAreaChartBase, dataKey: 'pages_per_session' }),
      },
    };
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

    const data = PageAnalyticsCombinedSchema.parse({ topPages, topEntryPages, topExitPages });
    const compareData =
      compare &&
      PageAnalyticsCombinedSchema.parse({
        topPages: topPagesCompare,
        topEntryPages: topEntryPagesCompare,
        topExitPages: topExitPagesCompare,
      });

    return {
      topPages: toDataTable({ data: data.topPages, compare: compareData?.topPages, categoryKey: 'url' }),
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
