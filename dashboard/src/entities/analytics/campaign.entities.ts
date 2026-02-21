import { z } from 'zod';

const RawMetricFields = {
  total_visitors: z.coerce.number().int().nonnegative(),
  bounced_sessions: z.coerce.number().int().nonnegative(),
  total_sessions: z.coerce.number().int().nonnegative(),
  total_pageviews: z.coerce.number().int().nonnegative(),
  sum_session_duration_seconds: z.coerce.number().int().nonnegative(),
};

const MetricFields = {
  visitors: z.coerce.number().int().nonnegative(),
  bounceRate: z.coerce.number().nonnegative(),
  avgSessionDuration: z.string(),
  pagesPerSession: z.coerce.number().nonnegative(),
};

const RawMetricsSchema = z.object(RawMetricFields);
const MetricSchema = z.object(MetricFields);

export const UTM_DIMENSIONS = ['source', 'medium', 'content', 'term'] as const;

export type UTMDimension = (typeof UTM_DIMENSIONS)[number];

export const UTM_DIMENSION_TO_KEY: Record<UTMDimension, 'utm_source' | 'utm_medium' | 'utm_content' | 'utm_term'> =
  {
    source: 'utm_source',
    medium: 'utm_medium',
    content: 'utm_content',
    term: 'utm_term',
  };

function createRawBreakdownSchema<TLabel extends string>(labelKey: TLabel) {
  return RawMetricsSchema.extend({ [labelKey]: z.string() } as Record<TLabel, z.ZodString>);
}

function createBreakdownSchema<TLabel extends string>(labelKey: TLabel) {
  return MetricSchema.extend({ [labelKey]: z.string() } as Record<TLabel, z.ZodString>);
}

export const RawCampaignDataSchema = createRawBreakdownSchema('utm_campaign_name');

export const RawCampaignUTMBreakdownItemSchema = createRawBreakdownSchema('label');

export const CampaignSparklinePointSchema = z.object({
  date: z.string(),
  visitors: z.coerce.number().int().nonnegative(),
});

export const CampaignPerformanceSchema = MetricSchema.extend({
  name: z.string(),
});

export const CampaignListRowSummarySchema = CampaignPerformanceSchema.extend({
  sparkline: z.array(CampaignSparklinePointSchema),
});

export const CampaignUTMBreakdownItemSchema = createBreakdownSchema('label');

export const RawCampaignLandingPagePerformanceItemSchema = RawMetricsSchema.extend({
  utm_campaign_name: z.string(),
  landing_page_url: z.string(),
});

export const CampaignLandingPagePerformanceItemSchema = MetricSchema.extend({
  campaignName: z.string(),
  landingPageUrl: z.string(),
});

export const CampaignTrendRowSchema = z.object({
  date: z.string(),
  utm_campaign: z.string(),
  visitors: z.coerce.number().int().nonnegative(),
});

export type RawCampaignData = z.infer<typeof RawCampaignDataSchema>;
export type CampaignPerformance = z.infer<typeof CampaignPerformanceSchema>;
export type CampaignSparklinePoint = z.infer<typeof CampaignSparklinePointSchema>;
export type CampaignListRowSummary = z.infer<typeof CampaignListRowSummarySchema>;
export type RawCampaignUTMBreakdownItem = z.infer<typeof RawCampaignUTMBreakdownItemSchema>;
export type CampaignUTMBreakdownItem = z.infer<typeof CampaignUTMBreakdownItemSchema>;
export type CampaignTrendRow = z.infer<typeof CampaignTrendRowSchema>;
export type RawCampaignLandingPagePerformanceItem = z.infer<typeof RawCampaignLandingPagePerformanceItemSchema>;
export type CampaignLandingPagePerformanceItem = z.infer<typeof CampaignLandingPagePerformanceItemSchema>;

export const RawCampaignDataArraySchema = z.array(RawCampaignDataSchema);
export const CampaignPerformanceArraySchema = z.array(CampaignPerformanceSchema);
export const RawCampaignUTMBreakdownArraySchema = z.array(RawCampaignUTMBreakdownItemSchema);
export const CampaignUTMBreakdownArraySchema = z.array(CampaignUTMBreakdownItemSchema);
export const CampaignTrendRowArraySchema = z.array(CampaignTrendRowSchema);
export const RawCampaignLandingPagePerformanceArraySchema = z.array(RawCampaignLandingPagePerformanceItemSchema);
export const CampaignLandingPagePerformanceArraySchema = z.array(CampaignLandingPagePerformanceItemSchema);
