'use server';

import {
  fetchCampaignDirectoryPage,
  fetchCampaignUTMBreakdown,
  fetchCampaignLandingPagePerformance,
  fetchCampaignAudienceProfile,
  fetchCampaignSparklines,
} from '@/services/analytics/campaign.service';
import {
  CampaignUTMBreakdownItem,
  CampaignLandingPagePerformanceItem,
  CampaignSparklinePoint,
  CampaignListRowSummary,
  type UTMDimension,
} from '@/entities/analytics/campaign.entities';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { formatPercentage } from '@/utils/formatters';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

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
    query: BAAnalyticsQuery,
    pageIndex: number,
    pageSize: number,
  ): Promise<{
    campaigns: CampaignListRowSummary[];
    totalCampaigns: number;
    pageIndex: number;
    pageSize: number;
  }> => {
    const { main } = toSiteQuery(ctx.siteId, query);

    try {
      return fetchCampaignDirectoryPage(main, pageIndex, pageSize);
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
    query: BAAnalyticsQuery,
    campaignNames: string[],
  ): Promise<Record<string, CampaignSparklinePoint[]>> => {
    const { main } = toSiteQuery(ctx.siteId, query);

    try {
      return fetchCampaignSparklines(main, campaignNames);
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
  async (ctx: AuthContext, query: BAAnalyticsQuery, campaignName: string): Promise<CampaignExpandedDetails> => {
    const { main } = toSiteQuery(ctx.siteId, query);

    try {
      const [utmSource, landingPages, audienceProfile] = await Promise.all([
        fetchCampaignUTMBreakdown(main, 'source', campaignName),
        fetchCampaignLandingPagePerformance(main, campaignName),
        fetchCampaignAudienceProfile(main, campaignName),
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
    query: BAAnalyticsQuery,
    campaignName: string,
    dimension: UTMDimension,
  ): Promise<CampaignUTMBreakdownItem[]> => {
    const { main } = toSiteQuery(ctx.siteId, query);

    try {
      return fetchCampaignUTMBreakdown(main, dimension, campaignName);
    } catch (error) {
      console.error('Error in fetchCampaignUTMBreakdownAction:', error);
      return [];
    }
  },
);
