'use server';

import {
  getPageAnalytics,
  getPageDetail,
  getPageTrafficForTimePeriod,
  getEntryPageAnalyticsForSite,
  getExitPageAnalyticsForSite,
  getPagesSummaryWithChartsForSite,
} from '@/services/pages';
import { PageAnalytics } from '@/entities/pages';
import { TotalPageViewsRow } from '@/entities/pageviews';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/filter';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { toDataTable } from '@/presenters/toDataTable';
import { toTimezoneSparklineSeries } from '@/presenters/toTimezoneAreaChart';
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
      pagesPerSessionChartData: toTimezoneSparklineSeries({
        data: data.pagesPerSessionChartData,
        granularity,
        dataKey: 'value',
        dateRange,
        timezone,
      }),
      avgTimeChartData: toTimezoneSparklineSeries({
        data: data.avgTimeChartData,
        granularity,
        dataKey: 'value',
        dateRange,
        timezone,
      }),
      bounceRateChartData: toTimezoneSparklineSeries({
        data: data.bounceRateChartData,
        granularity,
        dataKey: 'value',
        dateRange,
        timezone,
      }),
      pageviewsChartData: toTimezoneSparklineSeries({
        data: data.pageviewsChartData,
        granularity,
        dataKey: 'views',
        dateRange,
        timezone,
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
