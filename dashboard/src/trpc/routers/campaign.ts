import { z } from 'zod';
import { createRouter, analyticsProcedure } from '@/trpc/init';
import {
  fetchCampaignDirectoryPage,
  fetchCampaignSparklines,
  fetchCampaignUTMBreakdown,
  fetchCampaignLandingPagePerformance,
  fetchCampaignAudienceProfile,
} from '@/services/analytics/campaign.service';
import { formatPercentage } from '@/utils/formatters';
import { getLocale } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';

function buildAudienceDistribution<
  TLabelKey extends string,
  TItem extends { visitors: number } & Record<TLabelKey, string>,
>(audience: TItem[], labelKey: TLabelKey, locale: SupportedLanguages): { label: string; value: string }[] {
  const totalVisitors = audience.reduce((sum, item) => sum + item.visitors, 0);
  if (totalVisitors === 0) return [];
  return audience.map((item) => ({
    label: item[labelKey],
    value: formatPercentage((item.visitors / totalVisitors) * 100, locale, { maximumFractionDigits: 0 }),
  }));
}

export const campaignRouter = createRouter({
  performance: analyticsProcedure
    .input(z.object({ pageIndex: z.number(), pageSize: z.number() }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      return fetchCampaignDirectoryPage(main, input.pageIndex, input.pageSize);
    }),

  sparklines: analyticsProcedure
    .input(z.object({ campaignNames: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      return fetchCampaignSparklines(main, input.campaignNames);
    }),

  expandedDetails: analyticsProcedure
    .input(z.object({ campaignName: z.string() }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      const [utmSource, landingPages, audienceProfile] = await Promise.all([
        fetchCampaignUTMBreakdown(main, 'source', input.campaignName),
        fetchCampaignLandingPagePerformance(main, input.campaignName),
        fetchCampaignAudienceProfile(main, input.campaignName),
      ]);
      const locale = (await getLocale()) as SupportedLanguages;
      return {
        utmSource,
        landingPages,
        devices: buildAudienceDistribution(audienceProfile.devices, 'device_type', locale),
        countries: buildAudienceDistribution(audienceProfile.countries, 'country_code', locale),
        browsers: buildAudienceDistribution(audienceProfile.browsers, 'browser', locale),
        operatingSystems: buildAudienceDistribution(audienceProfile.operatingSystems, 'os', locale),
      };
    }),

  utmBreakdown: analyticsProcedure
    .input(z.object({
      campaignName: z.string(),
      dimension: z.enum(['source', 'medium', 'term', 'content']),
    }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      return fetchCampaignUTMBreakdown(main, input.dimension, input.campaignName);
    }),
});
