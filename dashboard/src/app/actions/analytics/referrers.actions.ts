'use server';

import {
  getReferrerSourceAggregationDataForSite,
  getReferrerSummaryWithChartsForSite,
  getReferrerTableDataForSite,
  getReferrerTrafficTrendBySourceDataForSite,
  getTopReferrerUrlsForSite,
  getTopChannelsForSite,
  getTopReferrerSourcesForSite,
} from '@/services/analytics/referrers.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import {
  TopReferrerUrl,
  TopChannel,
  TopReferrerSource,
  TrafficSourcesCombinedSchema,
} from '@/entities/analytics/referrers.entities';
import { toPieChart } from '@/presenters/toPieChart';
import { getSortedCategories, toStackedAreaChart } from '@/presenters/toStackedAreaChart';
import { toDataTable } from '@/presenters/toDataTable';
import { toSparklineSeries } from '@/presenters/toAreaChart';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export const fetchReferrerSourceAggregationDataForSite = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    try {
      const data = await getReferrerSourceAggregationDataForSite(main);
      const compareData = compare && (await getReferrerSourceAggregationDataForSite(compare));
      return {
        data: toPieChart({
          data,
          key: 'referrer_source',
          dataKey: 'visitorCount',
          compare: compareData,
        }),
      };
    } catch (error) {
      console.error('Error fetching referrer distribution:', error);
      throw error;
    }
  },
);

export const fetchReferrerTrafficTrendBySourceDataForSite = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    try {
      const rawData = await getReferrerTrafficTrendBySourceDataForSite(main);
      const compareData = compare && (await getReferrerTrafficTrendBySourceDataForSite(compare));

      const sortedCategories = getSortedCategories(rawData, 'referrer_source', 'count');

      return toStackedAreaChart({
        data: rawData,
        categoryKey: 'referrer_source',
        valueKey: 'count',
        categories: sortedCategories,
        granularity: main.granularity,
        dateRange: { start: main.startDate, end: main.endDate },
        compare: compareData,
        compareDateRange: compare ? { start: compare.startDate, end: compare.endDate } : undefined,
      });
    } catch (error) {
      console.error('Error fetching referrer traffic trend by source:', error);
      throw error;
    }
  },
);

export const fetchReferrerSummaryWithChartsDataForSite = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main } = toSiteQuery(ctx.siteId, query);

    try {
      const raw = await getReferrerSummaryWithChartsForSite(main);

      const dateRange = { start: main.startDate, end: main.endDate };

      const referralSessionsChartData = toSparklineSeries({
        data: raw.referralSessionsChartData,
        granularity: main.granularity,
        dataKey: 'referralSessions',
        dateRange,
      });
      const referralPercentageChartData = toSparklineSeries({
        data: raw.referralPercentageChartData,
        granularity: main.granularity,
        dataKey: 'referralPercentage',
        dateRange,
      });
      const avgSessionDurationChartData = toSparklineSeries({
        data: raw.avgSessionDurationChartData,
        granularity: main.granularity,
        dataKey: 'avgSessionDuration',
        dateRange,
      });

      const data = {
        ...raw,
        referralSessionsChartData,
        referralPercentageChartData,
        avgSessionDurationChartData,
      };

      return { data };
    } catch (error) {
      console.error('Error fetching referrer summary with charts data:', error);
      throw error;
    }
  },
);

export const fetchReferrerTableDataForSite = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, limit: number = 100) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    try {
      const data = await getReferrerTableDataForSite(main, limit);
      const compareData = compare && (await getReferrerTableDataForSite(compare, limit));

      return {
        data: toDataTable({ data, compare: compareData, categoryKey: 'source_url' }),
      };
    } catch (error) {
      console.error('Error fetching referrer table data:', error);
      throw error;
    }
  },
);

export const fetchTopReferrerUrlsForSite = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, limit: number = 10): Promise<TopReferrerUrl[]> => {
    const { main } = toSiteQuery(ctx.siteId, query);

    try {
      return getTopReferrerUrlsForSite(main, limit);
    } catch (error) {
      console.error('Error fetching top referrer URLs:', error);
      throw error;
    }
  },
);

export const fetchTopChannelsForSite = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, limit: number = 10): Promise<TopChannel[]> => {
    const { main } = toSiteQuery(ctx.siteId, query);

    try {
      return getTopChannelsForSite(main, limit);
    } catch (error) {
      console.error('Error fetching top channels:', error);
      throw error;
    }
  },
);

export const fetchTopReferrerSourcesForSite = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, limit: number = 10): Promise<TopReferrerSource[]> => {
    const { main } = toSiteQuery(ctx.siteId, query);

    try {
      return getTopReferrerSourcesForSite(main, limit);
    } catch (error) {
      console.error('Error fetching top referrer sources:', error);
      throw error;
    }
  },
);

export const fetchTrafficSourcesCombinedAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, limit: number = 10) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    try {
      const [
        topReferrerUrls,
        compareTopReferrerUrls,
        topReferrerSources,
        compareTopReferrerSources,
        topChannels,
        compareTopChannels,
      ] = await Promise.all([
        getTopReferrerUrlsForSite(main, limit),
        compare && getTopReferrerUrlsForSite(compare, limit),
        getTopReferrerSourcesForSite(main, limit),
        compare && getTopReferrerSourcesForSite(compare, limit),
        getTopChannelsForSite(main, limit),
        compare && getTopChannelsForSite(compare, limit),
      ]);

      const data = TrafficSourcesCombinedSchema.parse({
        topReferrerUrls,
        topReferrerSources,
        topChannels,
      });

      const compareData =
        compare &&
        TrafficSourcesCombinedSchema.parse({
          topReferrerUrls: compareTopReferrerUrls,
          topReferrerSources: compareTopReferrerSources,
          topChannels: compareTopChannels,
        });

      return {
        topReferrerUrls: toDataTable({
          data: data.topReferrerUrls,
          compare: compareData?.topReferrerUrls,
          categoryKey: 'referrer_url',
        }),
        topReferrerSources: toDataTable({
          data: data.topReferrerSources,
          compare: compareData?.topReferrerSources,
          categoryKey: 'referrer_source',
        }),
        topChannels: toDataTable({
          data: data.topChannels,
          compare: compareData?.topChannels,
          categoryKey: 'channel',
        }),
      };
    } catch (error) {
      console.error('Error fetching combined traffic sources:', error);
      throw error;
    }
  },
);
