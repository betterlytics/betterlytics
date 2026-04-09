import { z } from 'zod';
import { createRouter, analyticsProcedure } from '@/trpc/init';
import { getUniqueVisitorsForSite } from '@/services/analytics/visitors.service';
import {
  getTotalPageViewsForSite,
  getTopPagesForSite,
  getTopEntryPagesForSite,
  getTopExitPagesForSite,
} from '@/services/analytics/pages.service';
import { getSessionMetrics, getSessionRangeMetrics } from '@/repositories/clickhouse/index.repository';
import { toAreaChart, toSparklineSeries } from '@/presenters/toAreaChart';
import { toDataTable } from '@/presenters/toDataTable';
import { toPartialPercentageCompare } from '@/presenters/toPartialPercentageCompare';
import { isStartBucketIncomplete, isEndBucketIncomplete } from '@/lib/ba-timerange';

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

export const overviewRouter = createRouter({
  summaryAndChart: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;

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
  }),

  topPages: analyticsProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ ctx, input }) => {
      const { main, compare } = ctx;
      const [data, compareData] = await Promise.all([
        getTopPagesForSite(main, input.limit),
        compare && getTopPagesForSite(compare, input.limit),
      ]);
      return toDataTable({ data, compare: compareData, categoryKey: 'url' });
    }),

  topEntryPages: analyticsProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ ctx, input }) => {
      const { main, compare } = ctx;
      const [data, compareData] = await Promise.all([
        getTopEntryPagesForSite(main, input.limit),
        compare && getTopEntryPagesForSite(compare, input.limit),
      ]);
      return toDataTable({ data, compare: compareData, categoryKey: 'url' });
    }),

  topExitPages: analyticsProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ ctx, input }) => {
      const { main, compare } = ctx;
      const [data, compareData] = await Promise.all([
        getTopExitPagesForSite(main, input.limit),
        compare && getTopExitPagesForSite(compare, input.limit),
      ]);
      return toDataTable({ data, compare: compareData, categoryKey: 'url' });
    }),

});
