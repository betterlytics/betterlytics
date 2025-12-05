'use server';

import {
  getPageAnalytics,
  getPageDetail,
  getPageTrafficForTimePeriod,
  getEntryPageAnalyticsForSite,
  getExitPageAnalyticsForSite,
  getPagesSummaryWithChartsForSite,
} from '@/services/analytics/pages';
import { PageAnalytics } from '@/entities/analytics/pages';
import { TotalPageViewsRow } from '@/entities/analytics/pageviews';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/analytics/filter';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext';
import { toDataTable } from '@/presenters/toDataTable';
import { toSparklineSeries } from '@/presenters/toAreaChart';
import { toPartialPercentageCompare } from '@/presenters/toPartialPercentageCompare';

export const fetchPageAnalyticsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getPageAnalytics(ctx.siteId, startDate, endDate, queryFilters);

    const compareData =
      compareStartDate &&
      compareEndDate &&
      (await getPageAnalytics(ctx.siteId, compareStartDate, compareEndDate, queryFilters));

    return toDataTable({ data, compare: compareData, categoryKey: 'path' });
  },
);

export const fetchPageDetailAction = withDashboardAuthContext(
  async (ctx: AuthContext, path: string, startDate: Date, endDate: Date): Promise<PageAnalytics | null> => {
    return getPageDetail(ctx.siteId, path, startDate, endDate);
  },
);

export const fetchEntryPageAnalyticsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getEntryPageAnalyticsForSite(ctx.siteId, startDate, endDate, queryFilters);

    const compareData =
      compareStartDate &&
      compareEndDate &&
      (await getEntryPageAnalyticsForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters));

    return toDataTable({ data, compare: compareData, categoryKey: 'path' });
  },
);

export const fetchExitPageAnalyticsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getExitPageAnalyticsForSite(ctx.siteId, startDate, endDate, queryFilters);

    const compareData =
      compareStartDate &&
      compareEndDate &&
      (await getExitPageAnalyticsForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters));

    return toDataTable({ data, compare: compareData, categoryKey: 'path' });
  },
);

export const fetchPagesSummaryWithChartsAction = withDashboardAuthContext(
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
    const data = await getPagesSummaryWithChartsForSite(
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
      (await getPagesSummaryWithChartsForSite(
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
      keys: ['pagesPerSession', 'totalPageviews', 'avgTimeOnPage', 'avgBounceRate'] as const,
    });

    const dateRange = { start: startDate, end: endDate };

    return {
      ...data,
      pagesPerSessionChartData: toSparklineSeries({
        data: data.pagesPerSessionChartData,
        granularity,
        dataKey: 'value',
        dateRange,
      }),
      avgTimeChartData: toSparklineSeries({
        data: data.avgTimeChartData,
        granularity,
        dataKey: 'value',
        dateRange,
      }),
      bounceRateChartData: toSparklineSeries({
        data: data.bounceRateChartData,
        granularity,
        dataKey: 'value',
        dateRange,
      }),
      pageviewsChartData: toSparklineSeries({
        data: data.pageviewsChartData,
        granularity,
        dataKey: 'views',
        dateRange,
      }),
      compareValues,
    };
  },
);

export const fetchPageTrafficTimeSeriesAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    path: string,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    timezone: string,
  ): Promise<TotalPageViewsRow[]> => {
    return getPageTrafficForTimePeriod(ctx.siteId, path, startDate, endDate, granularity, timezone);
  },
);
