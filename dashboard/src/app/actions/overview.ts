'use server';

import {
  TopEntryPageRow,
  TopExitPageRow,
  PageAnalyticsCombined,
  PageAnalyticsCombinedSchema,
} from '@/entities/pages';
import {
  getTopPagesForSite,
  getTotalPageViewsForSite,
  getTopEntryPagesForSite,
  getTopExitPagesForSite,
} from '@/services/pages';
import { getSummaryStatsWithChartsForSite } from '@/services/visitors';
import { getUniqueVisitorsForSite } from '@/services/visitors';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/filter';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { getSessionMetrics } from '@/repositories/clickhouse';
import { toDateTimeString } from '@/utils/dateFormatters';
import { toAreaChart } from '@/presenters/toAreaChart';
import { toDataTable } from '@/presenters/toDataTable';

export const fetchTotalPageViewsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getTotalPageViewsForSite(ctx.siteId, startDate, endDate, granularity, queryFilters);
    const compare =
      compareStartDate &&
      compareEndDate &&
      (await getTotalPageViewsForSite(ctx.siteId, compareStartDate, compareEndDate, granularity, queryFilters));

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
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getUniqueVisitorsForSite(ctx.siteId, startDate, endDate, granularity, queryFilters);
    const compare =
      compareStartDate &&
      compareEndDate &&
      (await getUniqueVisitorsForSite(ctx.siteId, compareStartDate, compareEndDate, granularity, queryFilters));
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
    });
  },
);

// Enhanced summary stats action that includes chart data
export const fetchSummaryStatsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getSummaryStatsWithChartsForSite(ctx.siteId, startDate, endDate, queryFilters);
    const compare =
      compareStartDate &&
      compareEndDate &&
      (await getSummaryStatsWithChartsForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters));

    const comparePercentage = (key: keyof typeof data) => {
      if (!compare) {
        return null;
      }

      if (typeof data[key] !== 'number' || typeof compare[key] !== 'number') {
        throw new Error('Invalid data');
      }

      const current = data[key];
      const previous = compare[key];

      if (previous === 0) {
        return null;
      }

      return ((current - previous) / previous) * 100;
    };

    const compareValues = {
      uniqueVisitors: comparePercentage('uniqueVisitors'),
      pageviews: comparePercentage('pageviews'),
      sessions: comparePercentage('sessions'),
      pagesPerSession: comparePercentage('pagesPerSession'),
      avgVisitDuration: comparePercentage('avgVisitDuration'),
      bounceRate: comparePercentage('bounceRate'),
    };

    return {
      ...data,
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
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getSessionMetrics(
      ctx.siteId,
      toDateTimeString(startDate),
      toDateTimeString(endDate),
      granularity,
      queryFilters,
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
      ));

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
