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
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { getSessionMetrics } from '@/repositories/clickhouse/index.repository';
import { toDateTimeString } from '@/utils/dateFormatters';
import { toAreaChart, toSparklineSeries } from '@/presenters/toAreaChart';
import { toDataTable } from '@/presenters/toDataTable';
import { toPartialPercentageCompare } from '@/presenters/toPartialPercentageCompare';
import { isStartBucketIncomplete } from '@/lib/ba-timerange';

export const fetchTotalPageViewsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
    timezone: string,
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getTotalPageViewsForSite(
      ctx.siteId,
      startDate,
      endDate,
      granularity,
      queryFilters,
      timezone,
    );
    const compare =
      compareStartDate &&
      compareEndDate &&
      (await getTotalPageViewsForSite(
        ctx.siteId,
        compareStartDate,
        compareEndDate,
        granularity,
        queryFilters,
        timezone,
      ));

    return toAreaChart({
      data,
      granularity,
      dataKey: 'views',
      dateRange: {
        start: startDate,
        end: endDate,
      },
      compare,
      compareDateRange: {
        start: compareStartDate,
        end: compareEndDate,
      },
      bucketIncomplete: endDate.getTime() > Date.now(),
      startBucketIncomplete: isStartBucketIncomplete(startDate, granularity, timezone),
    });
  },
);

export const fetchUniqueVisitorsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
    timezone: string,
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getUniqueVisitorsForSite(
      ctx.siteId,
      startDate,
      endDate,
      granularity,
      queryFilters,
      timezone,
    );
    const compare =
      compareStartDate &&
      compareEndDate &&
      (await getUniqueVisitorsForSite(
        ctx.siteId,
        compareStartDate,
        compareEndDate,
        granularity,
        queryFilters,
        timezone,
      ));
    return toAreaChart({
      data,
      granularity,
      dataKey: 'unique_visitors',
      dateRange: {
        start: startDate,
        end: endDate,
      },
      compare,
      compareDateRange: {
        start: compareStartDate,
        end: compareEndDate,
      },
      bucketIncomplete: endDate.getTime() > Date.now(),
      startBucketIncomplete: isStartBucketIncomplete(startDate, granularity, timezone),
    });
  },
);

// Enhanced summary stats action that includes chart data
export const fetchSummaryStatsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
    timezone: string,
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getSummaryStatsWithChartsForSite(
      ctx.siteId,
      startDate,
      endDate,
      granularity,
      queryFilters,
      timezone,
    );
    const compare =
      compareStartDate &&
      compareEndDate &&
      (await getSummaryStatsWithChartsForSite(
        ctx.siteId,
        compareStartDate,
        compareEndDate,
        granularity,
        queryFilters,
        timezone,
      ));

    const compareValues = toPartialPercentageCompare({
      data,
      compare,
      keys: [
        'uniqueVisitors',
        'pageviews',
        'sessions',
        'pagesPerSession',
        'avgVisitDuration',
        'bounceRate',
      ] as const,
    });

    const dateRange = { start: startDate, end: endDate };

    return {
      ...data,
      visitorsChartData: toSparklineSeries({
        data: data.visitorsChartData,
        granularity,
        dataKey: 'unique_visitors',
        dateRange,
      }),
      pageviewsChartData: toSparklineSeries({
        data: data.pageviewsChartData,
        granularity,
        dataKey: 'views',
        dateRange,
      }),
      sessionsChartData: toSparklineSeries({
        data: data.sessionsChartData,
        granularity,
        dataKey: 'sessions',
        dateRange,
      }),
      bounceRateChartData: toSparklineSeries({
        data: data.bounceRateChartData,
        granularity,
        dataKey: 'bounce_rate',
        dateRange,
      }),
      avgVisitDurationChartData: toSparklineSeries({
        data: data.avgVisitDurationChartData,
        granularity,
        dataKey: 'avg_visit_duration',
        dateRange,
      }),
      pagesPerSessionChartData: toSparklineSeries({
        data: data.pagesPerSessionChartData,
        granularity,
        dataKey: 'pages_per_session',
        dateRange,
      }),
      compareValues,
    };
  },
);

export const fetchSessionMetricsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
    timezone: string,
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getSessionMetrics(
      ctx.siteId,
      toDateTimeString(startDate),
      toDateTimeString(endDate),
      granularity,
      queryFilters,
      timezone,
    );

    const compare =
      compareStartDate &&
      compareEndDate &&
      (await getSessionMetrics(
        ctx.siteId,
        toDateTimeString(compareStartDate),
        toDateTimeString(compareEndDate),
        granularity,
        queryFilters,
        timezone,
      ));

    const startIncomplete = isStartBucketIncomplete(startDate, granularity, timezone);

    return {
      avgVisitDuration: toAreaChart({
        data,
        granularity,
        dataKey: 'avg_visit_duration',
        dateRange: {
          start: startDate,
          end: endDate,
        },
        compare,
        compareDateRange: {
          start: compareStartDate,
          end: compareEndDate,
        },
        bucketIncomplete: endDate.getTime() > Date.now(),
        startBucketIncomplete: startIncomplete,
      }),
      bounceRate: toAreaChart({
        data,
        granularity,
        dataKey: 'bounce_rate',
        dateRange: {
          start: startDate,
          end: endDate,
        },
        compare,
        compareDateRange: {
          start: compareStartDate,
          end: compareEndDate,
        },
        bucketIncomplete: endDate.getTime() > Date.now(),
        startBucketIncomplete: startIncomplete,
      }),
      pagesPerSession: toAreaChart({
        data,
        granularity,
        dataKey: 'pages_per_session',
        dateRange: {
          start: startDate,
          end: endDate,
        },
        compare,
        compareDateRange: {
          start: compareStartDate,
          end: compareEndDate,
        },
        bucketIncomplete: endDate.getTime() > Date.now(),
        startBucketIncomplete: startIncomplete,
      }),
      sessions: toAreaChart({
        data,
        granularity,
        dataKey: 'sessions',
        dateRange: {
          start: startDate,
          end: endDate,
        },
        compare,
        compareDateRange: {
          start: compareStartDate,
          end: compareEndDate,
        },
        bucketIncomplete: endDate.getTime() > Date.now(),
        startBucketIncomplete: startIncomplete,
      }),
    };
  },
);

export const fetchTopEntryPagesAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    limit: number,
    queryFilters: QueryFilter[],
  ): Promise<TopEntryPageRow[]> => {
    return getTopEntryPagesForSite(ctx.siteId, startDate, endDate, limit, queryFilters);
  },
);

export const fetchTopExitPagesAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    limit: number,
    queryFilters: QueryFilter[],
  ): Promise<TopExitPageRow[]> => {
    return getTopExitPagesForSite(ctx.siteId, startDate, endDate, limit, queryFilters);
  },
);

export const fetchPageAnalyticsCombinedAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    limit: number = 5,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const [topPages, topPagesCompare, topEntryPages, topEntryPagesCompare, topExitPages, topExitPagesCompare] =
      await Promise.all([
        getTopPagesForSite(ctx.siteId, startDate, endDate, limit, queryFilters),
        compareStartDate &&
          compareEndDate &&
          getTopPagesForSite(ctx.siteId, compareStartDate, compareEndDate, limit, queryFilters),
        getTopEntryPagesForSite(ctx.siteId, startDate, endDate, limit, queryFilters),
        compareStartDate &&
          compareEndDate &&
          getTopEntryPagesForSite(ctx.siteId, compareStartDate, compareEndDate, limit, queryFilters),
        getTopExitPagesForSite(ctx.siteId, startDate, endDate, limit, queryFilters),
        compareStartDate &&
          compareEndDate &&
          getTopExitPagesForSite(ctx.siteId, compareStartDate, compareEndDate, limit, queryFilters),
      ]);

    const data = PageAnalyticsCombinedSchema.parse({
      topPages,
      topEntryPages,
      topExitPages,
    });

    const compare =
      compareStartDate &&
      compareEndDate &&
      PageAnalyticsCombinedSchema.parse({
        topPages: topPagesCompare,
        topEntryPages: topEntryPagesCompare,
        topExitPages: topExitPagesCompare,
      });

    return {
      topPages: toDataTable({
        data: data.topPages,
        compare: compare?.topPages,
        categoryKey: 'url',
      }),
      topEntryPages: toDataTable({
        data: data.topEntryPages,
        compare: compare?.topEntryPages,
        categoryKey: 'url',
      }),
      topExitPages: toDataTable({
        data: data.topExitPages,
        compare: compare?.topExitPages,
        categoryKey: 'url',
      }),
    };
  },
);
