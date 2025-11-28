'use server';

import {
  fetchCampaignDirectoryPage,
  fetchCampaignSourceBreakdown,
  fetchCampaignMediumBreakdown,
  fetchCampaignContentBreakdown,
  fetchCampaignTermBreakdown,
  fetchCampaignLandingPagePerformance,
  fetchCampaignAudienceProfile,
  fetchCampaignSparklines,
} from '@/services/campaign';
import {
  CampaignSourceBreakdownItem,
  CampaignMediumBreakdownItem,
  CampaignContentBreakdownItem,
  CampaignTermBreakdownItem,
  CampaignLandingPagePerformanceItem,
  CampaignSparklinePoint,
  CampaignDirectoryRowSummary,
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
    startDate: Date,
    endDate: Date,
    campaignName: string,
  ): Promise<CampaignExpandedDetails> => {
    try {
      const [utmSource, landingPages, audienceProfile] = await Promise.all([
        fetchCampaignSourceBreakdown(ctx.siteId, startDate, endDate, campaignName),
        fetchCampaignLandingPagePerformance(ctx.siteId, startDate, endDate, campaignName),
        fetchCampaignAudienceProfile(ctx.siteId, startDate, endDate, campaignName),
      ]);

      const {
        devices: deviceAudience,
        countries: countryAudience,
        browsers: browserAudience,
        operatingSystems: osAudience,
      } = audienceProfile;

      const devices = buildAudienceDistribution(deviceAudience, 'device_type');
      const countries = buildAudienceDistribution(countryAudience, 'country_code');
      const browsers = buildAudienceDistribution(browserAudience, 'browser');
      const operatingSystems = buildAudienceDistribution(osAudience, 'os');

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
    startDate: Date,
    endDate: Date,
    campaignName: string,
    dimension: CampaignUTMDimension,
  ): Promise<CampaignUTMBreakdownItem[]> => {
    try {
      const fetcher = utmBreakdownFetchers[dimension];
      return fetcher(ctx.siteId, startDate, endDate, campaignName);
    } catch (error) {
      console.error('Error in fetchCampaignUTMBreakdownAction:', error);
      return [];
    }
  },
);
