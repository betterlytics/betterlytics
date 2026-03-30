'use server';

import { PageAnalyticsCombinedSchema } from '@/entities/analytics/pages.entities';
import {
  getTopPagesForSite,
  getTopEntryPagesForSite,
  getTopExitPagesForSite,
} from '@/services/analytics/pages.service';
import { getSummaryStatsWithChartsForSite } from '@/services/analytics/visitors.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { toAreaChart, toSparklineSeries } from '@/presenters/toAreaChart';
import { toDataTable } from '@/presenters/toDataTable';
import { toPartialPercentageCompare } from '@/presenters/toPartialPercentageCompare';
import { isStartBucketIncomplete, isEndBucketIncomplete } from '@/lib/ba-timerange';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export const fetchOverviewDataAction = withDashboardAuthContext(
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
    const compareDateRange = compare ? { start: compare.startDate, end: compare.endDate } : undefined;
    const bucketIncomplete =
      main.endDate.getTime() > Date.now() ||
      isEndBucketIncomplete(main.endDate, main.granularity, main.timezone);
    const startBucketIncomplete = isStartBucketIncomplete(main.startDate, main.granularity, main.timezone);

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
      visitorsAreaChart: toAreaChart({
        data: data.visitorsChartData,
        granularity: main.granularity,
        dataKey: 'unique_visitors',
        dateRange,
        compare: compareData?.visitorsChartData,
        compareDateRange,
        bucketIncomplete,
        startBucketIncomplete,
      }),
      pageviewsAreaChart: toAreaChart({
        data: data.pageviewsChartData,
        granularity: main.granularity,
        dataKey: 'views',
        dateRange,
        compare: compareData?.pageviewsChartData,
        compareDateRange,
        bucketIncomplete,
        startBucketIncomplete,
      }),
      sessionMetricsAreaCharts: {
        avgVisitDuration: toAreaChart({
          data: data.sessionsChartData,
          granularity: main.granularity,
          dataKey: 'avg_visit_duration',
          dateRange,
          compare: compareData?.sessionsChartData,
          compareDateRange,
          bucketIncomplete,
          startBucketIncomplete,
        }),
        bounceRate: toAreaChart({
          data: data.sessionsChartData,
          granularity: main.granularity,
          dataKey: 'bounce_rate',
          dateRange,
          compare: compareData?.sessionsChartData,
          compareDateRange,
          bucketIncomplete,
          startBucketIncomplete,
        }),
        pagesPerSession: toAreaChart({
          data: data.sessionsChartData,
          granularity: main.granularity,
          dataKey: 'pages_per_session',
          dateRange,
          compare: compareData?.sessionsChartData,
          compareDateRange,
          bucketIncomplete,
          startBucketIncomplete,
        }),
        sessions: toAreaChart({
          data: data.sessionsChartData,
          granularity: main.granularity,
          dataKey: 'sessions',
          dateRange,
          compare: compareData?.sessionsChartData,
          compareDateRange,
          bucketIncomplete,
          startBucketIncomplete,
        }),
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
