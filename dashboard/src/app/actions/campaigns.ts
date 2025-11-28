'use server';

import {
  fetchCampaignPerformance,
  fetchCampaignSourceBreakdown,
  fetchCampaignMediumBreakdown,
  fetchCampaignContentBreakdown,
  fetchCampaignTermBreakdown,
  fetchCampaignLandingPagePerformance,
  fetchCampaignDeviceAudience,
  fetchCampaignCountryAudience,
  fetchCampaignBrowserAudience,
  fetchCampaignOperatingSystemAudience,
  fetchCampaignSparklines,
} from '@/services/campaign';
import {
  CampaignPerformance,
  CampaignSourceBreakdownItem,
  CampaignMediumBreakdownItem,
  CampaignContentBreakdownItem,
  CampaignTermBreakdownItem,
  CampaignLandingPagePerformanceItem,
  CampaignSparklinePoint,
} from '@/entities/campaign';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { formatPercentage } from '@/utils/formatters';

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

export const fetchCampaignSparklinesAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    timezone: string,
    campaignNames: string[],
  ): Promise<Record<string, CampaignSparklinePoint[]>> => {
    try {
      return fetchCampaignSparklines(ctx.siteId, startDate, endDate, granularity, timezone, campaignNames);
    } catch (error) {
      console.error('Error in fetchCampaignSparklinesAction:', error);
      return {};
    }
  },
);

export type CampaignExpandedDetails = {
  utmSource: CampaignSourceBreakdownItem[];
  landingPages: CampaignLandingPagePerformanceItem[];
  devices: { label: string; value: string }[];
  countries: { label: string; value: string }[];
  browsers: { label: string; value: string }[];
  operatingSystems: { label: string; value: string }[];
};

export type CampaignUTMBreakdownItem =
  | CampaignSourceBreakdownItem
  | CampaignMediumBreakdownItem
  | CampaignContentBreakdownItem
  | CampaignTermBreakdownItem;

export type CampaignUTMDimension = 'source' | 'medium' | 'content' | 'term';

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

      const [utmSource, landingPages, deviceAudience, countryAudience, browserAudience, osAudience] =
        await Promise.all([
          fetchCampaignSourceBreakdown(ctx.siteId, startDate, endDate, campaignName),
          fetchCampaignLandingPagePerformance(ctx.siteId, startDate, endDate, campaignName),
          fetchCampaignDeviceAudience(ctx.siteId, startDate, endDate, campaignName),
          fetchCampaignCountryAudience(ctx.siteId, startDate, endDate, campaignName),
          fetchCampaignBrowserAudience(ctx.siteId, startDate, endDate, campaignName),
          fetchCampaignOperatingSystemAudience(ctx.siteId, startDate, endDate, campaignName),
        ]);

      const totalDeviceVisitors = deviceAudience.reduce((sum, item) => sum + item.visitors, 0);
      const totalCountryVisitors = countryAudience.reduce((sum, item) => sum + item.visitors, 0);
      const totalBrowserVisitors = browserAudience.reduce((sum, item) => sum + item.visitors, 0);
      const totalOSVisitors = osAudience.reduce((sum, item) => sum + item.visitors, 0);

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

      const browsers =
        totalBrowserVisitors === 0
          ? []
          : browserAudience.map((item) => ({
              label: item.browser,
              value: formatPercentage((item.visitors / totalBrowserVisitors) * 100, 0),
            }));

      const operatingSystems =
        totalOSVisitors === 0
          ? []
          : osAudience.map((item) => ({
              label: item.os,
              value: formatPercentage((item.visitors / totalOSVisitors) * 100, 0),
            }));

      return {
        utmSource,
        landingPages,
        devices,
        countries,
        browsers,
        operatingSystems,
      };
    } catch (error) {
      console.error('Error in fetchCampaignExpandedDetailsAction:', error);
      return {
        utmSource: [],
        landingPages: [],
        devices: [],
        countries: [],
        browsers: [],
        operatingSystems: [],
      };
    }
  },
);

const utmBreakdownFetchers: Record<
  CampaignUTMDimension,
  (siteId: string, startDate: Date, endDate: Date, campaignName: string) => Promise<CampaignUTMBreakdownItem[]>
> = {
  source: fetchCampaignSourceBreakdown,
  medium: fetchCampaignMediumBreakdown,
  content: fetchCampaignContentBreakdown,
  term: fetchCampaignTermBreakdown,
};

export const fetchCampaignUTMBreakdownAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDateIso: string,
    endDateIso: string,
    campaignName: string,
    dimension: CampaignUTMDimension,
  ): Promise<CampaignUTMBreakdownItem[]> => {
    try {
      const startDate = new Date(startDateIso);
      const endDate = new Date(endDateIso);
      const fetcher = utmBreakdownFetchers[dimension];
      return fetcher(ctx.siteId, startDate, endDate, campaignName);
    } catch (error) {
      console.error('Error in fetchCampaignUTMBreakdownAction:', error);
      return [];
    }
  },
);
