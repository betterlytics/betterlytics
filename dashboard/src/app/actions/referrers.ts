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
import {
  TopReferrerUrl,
  TopChannel,
  TopReferrerSource,
  TrafficSourcesCombined,
  TrafficSourcesCombinedSchema,
} from '@/entities/referrers';
import { QueryFilter } from '@/entities/filter';
import { toPieChart } from '@/presenters/toPieChart';
import { toStackedAreaChart, getSortedCategories } from '@/presenters/toStackedAreaChart';
import { toDataTable } from '@/presenters/toDataTable';

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
        ));

      const sortedCategories = getSortedCategories(rawData, 'referrer_source', 'count');

      const result = toStackedAreaChart({
        data: rawData,
        categoryKey: 'referrer_source',
        valueKey: 'count',
        categories: sortedCategories,
        granularity,
        dateRange: { start: startDate, end: endDate },
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
  async (ctx: AuthContext, startDate: Date, endDate: Date, queryFilters: QueryFilter[]) => {
    try {
      const data = await getReferrerSummaryWithChartsForSite(ctx.siteId, startDate, endDate, queryFilters);
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
        (await getReferrerTableDataForSite(ctx.siteId, startDate, endDate, queryFilters, limit));

      return {
        data: toDataTable({ data, compare, categoryKey: 'source_name' }),
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
  ): Promise<TrafficSourcesCombined> => {
    try {
      const [topReferrerUrls, topReferrerSources, topChannels] = await Promise.all([
        getTopReferrerUrlsForSite(ctx.siteId, startDate, endDate, queryFilters, limit),
        getTopReferrerSourcesForSite(ctx.siteId, startDate, endDate, queryFilters, limit),
        getTopChannelsForSite(ctx.siteId, startDate, endDate, queryFilters, limit),
      ]);

      return TrafficSourcesCombinedSchema.parse({
        topReferrerUrls,
        topReferrerSources,
        topChannels,
      });
    } catch (error) {
      console.error('Error fetching combined traffic sources:', error);
      throw error;
    }
  },
);
