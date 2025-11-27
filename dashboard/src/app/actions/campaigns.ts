'use server';

import {
  fetchCampaignPerformance,
  fetchCampaignSourceBreakdown,
  fetchCampaignVisitorTrend,
  fetchCampaignMediumBreakdown,
  fetchCampaignContentBreakdown,
  fetchCampaignTermBreakdown,
  fetchCampaignLandingPagePerformance,
  fetchCampaignDeviceAudience,
  fetchCampaignCountryAudience,
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
import { AuthContext } from '@/entities/authContext';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { getSortedCategories, toStackedAreaChart } from '@/presenters/toStackedAreaChart';
import { formatPercentage } from '@/utils/formatters';

export const fetchCampaignPerformanceAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    campaignName?: string,
  ): Promise<CampaignPerformance[]> => {
    try {
      const performanceData = await fetchCampaignPerformance(ctx.siteId, startDate, endDate, campaignName);
      return performanceData;
    } catch (error) {
      console.error('Error in fetchCampaignPerformanceAction:', error);
      return [];
    }
  },
);

export const fetchCampaignSourceBreakdownAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    campaignName?: string,
  ): Promise<CampaignSourceBreakdownItem[]> => {
    try {
      const breakdownData = await fetchCampaignSourceBreakdown(ctx.siteId, startDate, endDate, campaignName);
      return breakdownData;
    } catch (error) {
      console.error('Error in fetchCampaignSourceBreakdownAction:', error);
      return [];
    }
  },
);

export const fetchCampaignMediumBreakdownAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    campaignName?: string,
  ): Promise<CampaignMediumBreakdownItem[]> => {
    try {
      const breakdownData = await fetchCampaignMediumBreakdown(ctx.siteId, startDate, endDate, campaignName);
      return breakdownData;
    } catch (error) {
      console.error('Error in fetchCampaignMediumBreakdownAction:', error);
      return [];
    }
  },
);

export const fetchCampaignContentBreakdownAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    campaignName?: string,
  ): Promise<CampaignContentBreakdownItem[]> => {
    try {
      const breakdownData = await fetchCampaignContentBreakdown(ctx.siteId, startDate, endDate, campaignName);
      return breakdownData;
    } catch (error) {
      console.error('Error in fetchCampaignContentBreakdownAction:', error);
      return [];
    }
  },
);

export const fetchCampaignTermBreakdownAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    campaignName?: string,
  ): Promise<CampaignTermBreakdownItem[]> => {
    try {
      const breakdownData = await fetchCampaignTermBreakdown(ctx.siteId, startDate, endDate, campaignName);
      return breakdownData;
    } catch (error) {
      console.error('Error in fetchCampaignTermBreakdownAction:', error);
      return [];
    }
  },
);

export const fetchCampaignLandingPagePerformanceAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    campaignName?: string,
  ): Promise<CampaignLandingPagePerformanceItem[]> => {
    try {
      const performanceData = await fetchCampaignLandingPagePerformance(
        ctx.siteId,
        startDate,
        endDate,
        campaignName,
      );
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
    campaignName?: string,
  ) => {
    try {
      const rawData = await fetchCampaignVisitorTrend(
        ctx.siteId,
        startDate,
        endDate,
        granularity,
        timezone,
        campaignName,
      );

      const compareData =
        compareStartDate &&
        compareEndDate &&
        (await fetchCampaignVisitorTrend(
          ctx.siteId,
          compareStartDate,
          compareEndDate,
          granularity,
          timezone,
          campaignName,
        ));

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

export type CampaignExpandedDetails = {
  utmSource: CampaignSourceBreakdownItem[];
  utmMedium: CampaignMediumBreakdownItem[];
  utmContent: CampaignContentBreakdownItem[];
  utmTerm: CampaignTermBreakdownItem[];
  landingPages: CampaignLandingPagePerformanceItem[];
  devices: { label: string; value: string }[];
  countries: { label: string; value: string }[];
};

export const fetchCampaignExpandedDetailsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDateIso: string,
    endDateIso: string,
    campaignName: string,
  ): Promise<CampaignExpandedDetails> => {
    try {
      const startDate = new Date(startDateIso);
      const endDate = new Date(endDateIso);

      const [source, medium, content, term, landingPages, deviceAudience, countryAudience] = await Promise.all([
        fetchCampaignSourceBreakdown(ctx.siteId, startDate, endDate, campaignName),
        fetchCampaignMediumBreakdown(ctx.siteId, startDate, endDate, campaignName),
        fetchCampaignContentBreakdown(ctx.siteId, startDate, endDate, campaignName),
        fetchCampaignTermBreakdown(ctx.siteId, startDate, endDate, campaignName),
        fetchCampaignLandingPagePerformance(ctx.siteId, startDate, endDate, campaignName),
        fetchCampaignDeviceAudience(ctx.siteId, startDate, endDate, campaignName),
        fetchCampaignCountryAudience(ctx.siteId, startDate, endDate, campaignName),
      ]);

      const totalDeviceVisitors = deviceAudience.reduce((sum, item) => sum + item.visitors, 0);
      const totalCountryVisitors = countryAudience.reduce((sum, item) => sum + item.visitors, 0);

      const devices =
        totalDeviceVisitors === 0
          ? []
          : deviceAudience.map((item) => ({
              label: item.device_type,
              value: formatPercentage((item.visitors / totalDeviceVisitors) * 100, 0),
            }));

      const countries =
        totalCountryVisitors === 0
          ? []
          : countryAudience.map((item) => ({
              label: item.country_code,
              value: formatPercentage((item.visitors / totalCountryVisitors) * 100, 0),
            }));

      return {
        utmSource: source,
        utmMedium: medium,
        utmContent: content,
        utmTerm: term,
        landingPages,
        devices,
        countries,
      };
    } catch (error) {
      console.error('Error in fetchCampaignExpandedDetailsAction:', error);
      return {
        utmSource: [],
        utmMedium: [],
        utmContent: [],
        utmTerm: [],
        landingPages: [],
        devices: [],
        countries: [],
      };
    }
  },
);
