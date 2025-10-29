'use server';

import {
  getReferrerSourceAggregationDataForSite,
  getReferrerSummaryWithChartsForSite,
  getReferrerTableDataForSite,
  getReferrerTrafficTrendBySourceDataForSite,
  getTopReferrerUrlsForSite,
  getTopChannelsForSite,
  getTopReferrerSourcesForSite,
} from '@/services/referrers';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { TopReferrerUrl, TopChannel, TopReferrerSource, TrafficSourcesCombinedSchema } from '@/entities/referrers';
import { QueryFilter } from '@/entities/filter';
import { toPieChart } from '@/presenters/toPieChart';
import { toTimezoneStackedAreaChart, getSortedCategories } from '@/presenters/toTimezoneStackedAreaChart';
import { toDataTable } from '@/presenters/toDataTable';
import { toTimezoneSparklineSeries } from '@/presenters/toTimezoneAreaChart';

/**
 * Fetches the referrer distribution data for a site
 */
export const fetchReferrerSourceAggregationDataForSite = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    try {
      const data = await getReferrerSourceAggregationDataForSite(ctx.siteId, startDate, endDate, queryFilters);
      const compare =
        compareStartDate &&
        compareEndDate &&
        (await getReferrerSourceAggregationDataForSite(
          ctx.siteId,
          compareStartDate,
          compareEndDate,
          queryFilters,
        ));
      return {
        data: toPieChart({
          data,
          key: 'referrer_source',
          dataKey: 'visitorCount',
          compare,
        }),
      };
    } catch (error) {
      console.error('Error fetching referrer distribution:', error);
      throw error;
    }
  },
);

/**
 * Fetches the referrer traffic trend data grouped by source type for a site with specified granularity
 */
export const fetchReferrerTrafficTrendBySourceDataForSite = withDashboardAuthContext(
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
    try {
      const rawData = await getReferrerTrafficTrendBySourceDataForSite(
        ctx.siteId,
        startDate,
        endDate,
        granularity,
        queryFilters,
        timezone,
      );

      const compareData =
        compareStartDate &&
        compareEndDate &&
        (await getReferrerTrafficTrendBySourceDataForSite(
          ctx.siteId,
          compareStartDate,
          compareEndDate,
          granularity,
          queryFilters,
          timezone,
        ));

      const sortedCategories = getSortedCategories(rawData, 'referrer_source', 'count');

      const result = toTimezoneStackedAreaChart({
        data: rawData,
        categoryKey: 'referrer_source',
        valueKey: 'count',
        categories: sortedCategories,
        granularity,
        dateRange: { start: startDate, end: endDate },
        timezone,
        compare: compareData,
        compareDateRange:
          compareStartDate && compareEndDate ? { start: compareStartDate, end: compareEndDate } : undefined,
      });

      return result;
    } catch (error) {
      console.error('Error fetching referrer traffic trend by source:', error);
      throw error;
    }
  },
);

/**
 * Fetches the summary data with charts for referrers including referral sessions, total sessions, top referrer source, avg session duration, and chart data
 */
export const fetchReferrerSummaryWithChartsDataForSite = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
    timezone: string,
  ) => {
    try {
      const raw = await getReferrerSummaryWithChartsForSite(
        ctx.siteId,
        startDate,
        endDate,
        granularity,
        queryFilters,
        timezone,
      );

      const dateRange = { start: startDate, end: endDate };

      const referralSessionsChartData = toTimezoneSparklineSeries({
        data: raw.referralSessionsChartData,
        granularity,
        dataKey: 'referralSessions',
        dateRange,
        timezone,
      });
      const referralPercentageChartData = toTimezoneSparklineSeries({
        data: raw.referralPercentageChartData,
        granularity,
        dataKey: 'referralPercentage',
        dateRange,
        timezone,
      });
      const avgSessionDurationChartData = toTimezoneSparklineSeries({
        data: raw.avgSessionDurationChartData,
        granularity,
        dataKey: 'avgSessionDuration',
        dateRange,
        timezone,
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

/**
 * Fetches detailed referrer data for table display
 */
export const fetchReferrerTableDataForSite = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    limit: number = 100,
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    try {
      const data = await getReferrerTableDataForSite(ctx.siteId, startDate, endDate, queryFilters, limit);
      const compare =
        compareStartDate &&
        compareEndDate &&
        (await getReferrerTableDataForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters, limit));

      return {
        data: toDataTable({ data, compare, categoryKey: 'source_url' }),
      };
    } catch (error) {
      console.error('Error fetching referrer table data:', error);
      throw error;
    }
  },
);

/**
 * Fetches top referrer URLs
 */
export const fetchTopReferrerUrlsForSite = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    limit: number = 10,
  ): Promise<TopReferrerUrl[]> => {
    try {
      const data = await getTopReferrerUrlsForSite(ctx.siteId, startDate, endDate, queryFilters, limit);
      return data;
    } catch (error) {
      console.error('Error fetching top referrer URLs:', error);
      throw error;
    }
  },
);

/**
 * Fetches top traffic channels
 */
export const fetchTopChannelsForSite = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    limit: number = 10,
  ): Promise<TopChannel[]> => {
    try {
      const data = await getTopChannelsForSite(ctx.siteId, startDate, endDate, queryFilters, limit);
      return data;
    } catch (error) {
      console.error('Error fetching top channels:', error);
      throw error;
    }
  },
);

/**
 * Fetches top referrer sources
 */
export const fetchTopReferrerSourcesForSite = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    limit: number = 10,
  ): Promise<TopReferrerSource[]> => {
    try {
      const data = await getTopReferrerSourcesForSite(ctx.siteId, startDate, endDate, queryFilters, limit);
      return data;
    } catch (error) {
      console.error('Error fetching top referrer sources:', error);
      throw error;
    }
  },
);

export const fetchTrafficSourcesCombinedAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    limit: number = 10,
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    try {
      const [
        topReferrerUrls,
        compareTopReferrerUrls,
        topReferrerSources,
        compareTopReferrerSources,
        topChannels,
        compareTopChannels,
      ] = await Promise.all([
        getTopReferrerUrlsForSite(ctx.siteId, startDate, endDate, queryFilters, limit),
        compareStartDate &&
          compareEndDate &&
          getTopReferrerUrlsForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters, limit),
        getTopReferrerSourcesForSite(ctx.siteId, startDate, endDate, queryFilters, limit),
        compareStartDate &&
          compareEndDate &&
          getTopReferrerSourcesForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters, limit),
        getTopChannelsForSite(ctx.siteId, startDate, endDate, queryFilters, limit),
        compareStartDate &&
          compareEndDate &&
          getTopChannelsForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters, limit),
      ]);

      const data = TrafficSourcesCombinedSchema.parse({
        topReferrerUrls,
        topReferrerSources,
        topChannels,
      });

      const compare =
        compareStartDate &&
        compareEndDate &&
        TrafficSourcesCombinedSchema.parse({
          topReferrerUrls: compareTopReferrerUrls,
          topReferrerSources: compareTopReferrerSources,
          topChannels: compareTopChannels,
        });

      return {
        topReferrerUrls: toDataTable({
          data: data.topReferrerUrls,
          compare: compare?.topReferrerUrls,
          categoryKey: 'referrer_url',
        }),
        topReferrerSources: toDataTable({
          data: data.topReferrerSources,
          compare: compare?.topReferrerSources,
          categoryKey: 'referrer_source',
        }),
        topChannels: toDataTable({
          data: data.topChannels,
          compare: compare?.topChannels,
          categoryKey: 'channel',
        }),
      };
    } catch (error) {
      console.error('Error fetching combined traffic sources:', error);
      throw error;
    }
  },
);
