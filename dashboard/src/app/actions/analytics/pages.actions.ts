'use server';

import {
  getPageAnalytics,
  getPageDetail,
  getPageTrafficForTimePeriod,
  getEntryPageAnalyticsForSite,
  getExitPageAnalyticsForSite,
  getPagesSummaryWithChartsForSite,
} from '@/services/analytics/pages.service';
import { PageAnalytics } from '@/entities/analytics/pages.entities';
import { TotalPageViewsRow } from '@/entities/analytics/pageviews.entities';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { toDataTable } from '@/presenters/toDataTable';
import { toSparklineSeries } from '@/presenters/toAreaChart';
import { toPartialPercentageCompare } from '@/presenters/toPartialPercentageCompare';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export const fetchPageAnalyticsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getPageAnalytics(main);
    const compareData = compare && (await getPageAnalytics(compare));

    return toDataTable({ data, compare: compareData, categoryKey: 'path' });
  },
);

export const fetchPageDetailAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, path: string): Promise<PageAnalytics | null> => {
    const { main } = toSiteQuery(ctx.siteId, query);
    return getPageDetail(main, path);
  },
);

export const fetchEntryPageAnalyticsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getEntryPageAnalyticsForSite(main);
    const compareData = compare && (await getEntryPageAnalyticsForSite(compare));

    return toDataTable({ data, compare: compareData, categoryKey: 'path' });
  },
);

export const fetchExitPageAnalyticsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getExitPageAnalyticsForSite(main);
    const compareData = compare && (await getExitPageAnalyticsForSite(compare));

    return toDataTable({ data, compare: compareData, categoryKey: 'path' });
  },
);

export const fetchPagesSummaryWithChartsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getPagesSummaryWithChartsForSite(main);
    const compareData = compare && (await getPagesSummaryWithChartsForSite(compare));

    const compareValues = toPartialPercentageCompare({
      data,
      compare: compareData,
      keys: ['pagesPerSession', 'totalPageviews', 'avgTimeOnPage', 'avgBounceRate'] as const,
    });

    const dateRange = { start: main.startDate, end: main.endDate };

    return {
      ...data,
      pagesPerSessionChartData: toSparklineSeries({
        data: data.pagesPerSessionChartData,
        granularity: main.granularity,
        dataKey: 'value',
        dateRange,
      }),
      avgTimeChartData: toSparklineSeries({
        data: data.avgTimeChartData,
        granularity: main.granularity,
        dataKey: 'value',
        dateRange,
      }),
      bounceRateChartData: toSparklineSeries({
        data: data.bounceRateChartData,
        granularity: main.granularity,
        dataKey: 'value',
        dateRange,
      }),
      pageviewsChartData: toSparklineSeries({
        data: data.pageviewsChartData,
        granularity: main.granularity,
        dataKey: 'views',
        dateRange,
      }),
      compareValues,
    };
  },
);

export const fetchPageTrafficTimeSeriesAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, path: string): Promise<TotalPageViewsRow[]> => {
    const { main } = toSiteQuery(ctx.siteId, query);
    return getPageTrafficForTimePeriod(main, path);
  },
);
