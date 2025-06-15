'use server';

import { DailySessionMetricsRow } from '@/entities/sessionMetrics';
import {
  TopPageRow,
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
import { fromFragmentedGranularityTimeSeriesToLineChartAreaChart } from '@/utils/fragmentedGranulatiryTimeSeriesAreaChart';

export const fetchTotalPageViewsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
  ) => {
    const data = await getTotalPageViewsForSite(ctx.siteId, startDate, endDate, granularity, queryFilters);
    return fromFragmentedGranularityTimeSeriesToLineChartAreaChart({
      data,
      granularity,
      dataKey: 'views',
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
  ) => {
    const data = await getUniqueVisitorsForSite(ctx.siteId, startDate, endDate, granularity, queryFilters);
    return fromFragmentedGranularityTimeSeriesToLineChartAreaChart({
      data,
      granularity,
      dataKey: 'unique_visitors',
    });
  },
);

// Enhanced summary stats action that includes chart data
export const fetchSummaryStatsAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date, queryFilters: QueryFilter[]) => {
    return getSummaryStatsWithChartsForSite(ctx.siteId, startDate, endDate, queryFilters);
  },
);

export const fetchTopPagesAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    limit: number,
    queryFilters: QueryFilter[],
  ): Promise<TopPageRow[]> => {
    return getTopPagesForSite(ctx.siteId, startDate, endDate, limit, queryFilters);
  },
);

export const fetchSessionMetricsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
  ): Promise<DailySessionMetricsRow[]> => {
    return getSessionMetrics(
      ctx.siteId,
      toDateTimeString(startDate),
      toDateTimeString(endDate),
      granularity,
      queryFilters,
    );
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
  ): Promise<PageAnalyticsCombined> => {
    const [topPages, topEntryPages, topExitPages] = await Promise.all([
      getTopPagesForSite(ctx.siteId, startDate, endDate, limit, queryFilters),
      getTopEntryPagesForSite(ctx.siteId, startDate, endDate, limit, queryFilters),
      getTopExitPagesForSite(ctx.siteId, startDate, endDate, limit, queryFilters),
    ]);

    return PageAnalyticsCombinedSchema.parse({
      topPages,
      topEntryPages,
      topExitPages,
    });
  },
);
