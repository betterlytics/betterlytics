'use server';

import {
  fetchCampaignPerformance,
  fetchCampaignSourceBreakdown,
  fetchCampaignVisitorTrend,
  fetchCampaignMediumBreakdown,
  fetchCampaignContentBreakdown,
  fetchCampaignTermBreakdown,
  fetchCampaignLandingPagePerformance,
} from '@/services/campaign';
import {
  CampaignPerformance,
  CampaignSourceBreakdownItem,
  CampaignMediumBreakdownItem,
  CampaignContentBreakdownItem,
  CampaignTermBreakdownItem,
  CampaignLandingPagePerformanceItem,
} from '@/entities/campaign';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { getSortedCategories, toStackedAreaChart } from '@/presenters/toStackedAreaChart';

export const fetchCampaignPerformanceAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date): Promise<CampaignPerformance[]> => {
    try {
      const performanceData = await fetchCampaignPerformance(ctx.siteId, startDate, endDate);
      return performanceData;
    } catch (error) {
      console.error('Error in fetchCampaignPerformanceAction:', error);
      return [];
    }
  },
);

export const fetchCampaignSourceBreakdownAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date): Promise<CampaignSourceBreakdownItem[]> => {
    try {
      const breakdownData = await fetchCampaignSourceBreakdown(ctx.siteId, startDate, endDate);
      return breakdownData;
    } catch (error) {
      console.error('Error in fetchCampaignSourceBreakdownAction:', error);
      return [];
    }
  },
);

export const fetchCampaignMediumBreakdownAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date): Promise<CampaignMediumBreakdownItem[]> => {
    try {
      const breakdownData = await fetchCampaignMediumBreakdown(ctx.siteId, startDate, endDate);
      return breakdownData;
    } catch (error) {
      console.error('Error in fetchCampaignMediumBreakdownAction:', error);
      return [];
    }
  },
);

export const fetchCampaignContentBreakdownAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date): Promise<CampaignContentBreakdownItem[]> => {
    try {
      const breakdownData = await fetchCampaignContentBreakdown(ctx.siteId, startDate, endDate);
      return breakdownData;
    } catch (error) {
      console.error('Error in fetchCampaignContentBreakdownAction:', error);
      return [];
    }
  },
);

export const fetchCampaignTermBreakdownAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date): Promise<CampaignTermBreakdownItem[]> => {
    try {
      const breakdownData = await fetchCampaignTermBreakdown(ctx.siteId, startDate, endDate);
      return breakdownData;
    } catch (error) {
      console.error('Error in fetchCampaignTermBreakdownAction:', error);
      return [];
    }
  },
);

export const fetchCampaignLandingPagePerformanceAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date): Promise<CampaignLandingPagePerformanceItem[]> => {
    try {
      const performanceData = await fetchCampaignLandingPagePerformance(ctx.siteId, startDate, endDate);
      return performanceData;
    } catch (error) {
      console.error('Error in fetchCampaignLandingPagePerformanceAction:', error);
      return [];
    }
  },
);

export const fetchCampaignVisitorTrendAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    timezone: string,
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    try {
      const rawData = await fetchCampaignVisitorTrend(ctx.siteId, startDate, endDate, granularity, timezone);

      const compareData =
        compareStartDate &&
        compareEndDate &&
        (await fetchCampaignVisitorTrend(ctx.siteId, compareStartDate, compareEndDate, granularity, timezone));

      const sortedCategories = getSortedCategories(rawData, 'utm_campaign', 'visitors');

      const result = toStackedAreaChart({
        data: rawData,
        categoryKey: 'utm_campaign',
        valueKey: 'visitors',
        categories: sortedCategories,
        granularity,
        dateRange: { start: startDate, end: endDate },
        compare: compareData,
        compareDateRange:
          compareStartDate && compareEndDate ? { start: compareStartDate, end: compareEndDate } : undefined,
      });

      return result;
    } catch (error) {
      console.error('Error in fetchCampaignVisitorTrendAction:', error);
      return { data: [], categories: [] };
    }
  },
);
