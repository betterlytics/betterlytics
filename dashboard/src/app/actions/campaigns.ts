'use server';

import {
  fetchCampaignDirectoryPage,
  fetchCampaignUTMBreakdown,
  fetchCampaignLandingPagePerformance,
  fetchCampaignAudienceProfile,
  fetchCampaignSparklines,
} from '@/services/campaign';
import {
  CampaignUTMBreakdownItem,
  CampaignLandingPagePerformanceItem,
  CampaignSparklinePoint,
  CampaignDirectoryRowSummary,
  type UTMDimension,
} from '@/entities/campaign';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { formatPercentage } from '@/utils/formatters';

function buildAudienceDistribution<
  TLabelKey extends string,
  TItem extends { visitors: number } & Record<TLabelKey, string>,
>(audience: TItem[], labelKey: TLabelKey): { label: string; value: string }[] {
  const totalVisitors = audience.reduce((sum, item) => sum + item.visitors, 0);

  if (totalVisitors === 0) {
    return [];
  }

  return audience.map((item) => ({
    label: item[labelKey],
    value: formatPercentage((item.visitors / totalVisitors) * 100, 0),
  }));
}

export const fetchCampaignPerformanceAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    timezone: string,
    pageIndex: number,
    pageSize: number,
  ): Promise<{
    campaigns: CampaignDirectoryRowSummary[];
    totalCampaigns: number;
    pageIndex: number;
    pageSize: number;
  }> => {
    try {
      const performancePage = await fetchCampaignDirectoryPage(
        ctx.siteId,
        startDate,
        endDate,
        granularity,
        timezone,
        pageIndex,
        pageSize,
      );
      return performancePage;
    } catch (error) {
      console.error('Error in fetchCampaignPerformanceAction:', error);
      return {
        campaigns: [],
        totalCampaigns: 0,
        pageIndex: 0,
        pageSize,
      };
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
  utmSource: CampaignUTMBreakdownItem[];
  landingPages: CampaignLandingPagePerformanceItem[];
  devices: { label: string; value: string }[];
  countries: { label: string; value: string }[];
  browsers: { label: string; value: string }[];
  operatingSystems: { label: string; value: string }[];
};

export const fetchCampaignExpandedDetailsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    campaignName: string,
  ): Promise<CampaignExpandedDetails> => {
    try {
      const [utmSource, landingPages, audienceProfile] = await Promise.all([
        fetchCampaignUTMBreakdown(ctx.siteId, startDate, endDate, 'source', campaignName),
        fetchCampaignLandingPagePerformance(ctx.siteId, startDate, endDate, campaignName),
        fetchCampaignAudienceProfile(ctx.siteId, startDate, endDate, campaignName),
      ]);

      const devices = buildAudienceDistribution(audienceProfile.devices, 'device_type');
      const countries = buildAudienceDistribution(audienceProfile.countries, 'country_code');
      const browsers = buildAudienceDistribution(audienceProfile.browsers, 'browser');
      const operatingSystems = buildAudienceDistribution(audienceProfile.operatingSystems, 'os');

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

export const fetchCampaignUTMBreakdownAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    campaignName: string,
    dimension: UTMDimension,
  ): Promise<CampaignUTMBreakdownItem[]> => {
    try {
      return fetchCampaignUTMBreakdown(ctx.siteId, startDate, endDate, dimension, campaignName);
    } catch (error) {
      console.error('Error in fetchCampaignUTMBreakdownAction:', error);
      return [];
    }
  },
);
