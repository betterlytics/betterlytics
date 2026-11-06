import { z } from 'zod';
import { createRouter, analyticsProcedure } from '@/trpc/init';
import {
  fetchCampaignDirectoryPage,
  fetchCampaignSparklines,
  fetchCampaignUTMBreakdown,
  fetchCampaignLandingPagePerformance,
  fetchCampaignAudienceProfile,
} from '@/services/analytics/campaign.service';

function buildAudienceDistribution<
  TLabelKey extends string,
  TItem extends { visitors: number } & Record<TLabelKey, string>,
>(audience: TItem[], labelKey: TLabelKey): { label: string; value: number }[] {
  const totalVisitors = audience.reduce((sum, item) => sum + item.visitors, 0);
  if (totalVisitors === 0) return [];
  return audience.map((item) => ({
    label: item[labelKey],
    value: (item.visitors / totalVisitors) * 100,
  }));
}

export const campaignRouter = createRouter({
  performance: analyticsProcedure
    .input(z.object({ pageIndex: z.number(), pageSize: z.number() }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      return fetchCampaignDirectoryPage(ctx.authContext, main, input.pageIndex, input.pageSize);
    }),

  sparklines: analyticsProcedure
    .input(z.object({ campaignNames: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      return fetchCampaignSparklines(ctx.authContext, main, input.campaignNames);
    }),

  expandedDetails: analyticsProcedure
    .input(z.object({ campaignName: z.string() }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      const [utmSource, landingPages, audienceProfile] = await Promise.all([
        fetchCampaignUTMBreakdown(ctx.authContext, main, 'source', input.campaignName),
        fetchCampaignLandingPagePerformance(ctx.authContext, main, input.campaignName),
        fetchCampaignAudienceProfile(ctx.authContext, main, input.campaignName),
      ]);
      return {
        utmSource,
        landingPages,
        devices: buildAudienceDistribution(audienceProfile.devices, 'device_type'),
        countries: buildAudienceDistribution(audienceProfile.countries, 'country_code'),
        browsers: buildAudienceDistribution(audienceProfile.browsers, 'browser'),
        operatingSystems: buildAudienceDistribution(audienceProfile.operatingSystems, 'os'),
      };
    }),

  utmBreakdown: analyticsProcedure
    .input(z.object({
      campaignName: z.string(),
      dimension: z.enum(['source', 'medium', 'term', 'content']),
    }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      return fetchCampaignUTMBreakdown(ctx.authContext, main, input.dimension, input.campaignName);
    }),
});
