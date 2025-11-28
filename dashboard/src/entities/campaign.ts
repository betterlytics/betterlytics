import { z } from 'zod';

const RawMetricFields = {
  total_visitors: z.number().int().nonnegative(),
  bounced_sessions: z.number().int().nonnegative(),
  total_sessions: z.number().int().nonnegative(),
  total_pageviews: z.number().int().nonnegative(),
  sum_session_duration_seconds: z.number().int().nonnegative(),
};

const MetricFields = {
  visitors: z.number().int().nonnegative(),
  bounceRate: z.number().nonnegative(),
  avgSessionDuration: z.string(),
  pagesPerSession: z.number().nonnegative(),
};

const RawMetricsSchema = z.object(RawMetricFields);
const MetricSchema = z.object(MetricFields);

function createRawBreakdownSchema<TLabel extends string>(labelKey: TLabel) {
  return RawMetricsSchema.extend({ [labelKey]: z.string() } as Record<TLabel, z.ZodString>);
}

function createBreakdownSchema<TLabel extends string>(labelKey: TLabel) {
  return MetricSchema.extend({ [labelKey]: z.string() } as Record<TLabel, z.ZodString>);
}

export const RawCampaignDataSchema = createRawBreakdownSchema('utm_campaign_name');

export const RawCampaignSourceBreakdownItemSchema = createRawBreakdownSchema('source');

export const RawCampaignMediumBreakdownItemSchema = createRawBreakdownSchema('medium');

export const CampaignSparklinePointSchema = z.object({
  date: z.string(),
  visitors: z.number().int().nonnegative(),
});

export const CampaignPerformanceSchema = MetricSchema.extend({
  name: z.string(),
});

export const CampaignDirectoryRowSummarySchema = CampaignPerformanceSchema.extend({
  sparkline: z.array(CampaignSparklinePointSchema),
});

export const CampaignSourceBreakdownItemSchema = createBreakdownSchema('source');

export const CampaignMediumBreakdownItemSchema = createBreakdownSchema('medium');

export const RawCampaignContentBreakdownItemSchema = createRawBreakdownSchema('content');

export const CampaignContentBreakdownItemSchema = createBreakdownSchema('content');

export const RawCampaignTermBreakdownItemSchema = createRawBreakdownSchema('term');

export const CampaignTermBreakdownItemSchema = createBreakdownSchema('term');

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
  visitors: z.number().int().nonnegative(),
});

export type RawCampaignData = z.infer<typeof RawCampaignDataSchema>;
export type CampaignPerformance = z.infer<typeof CampaignPerformanceSchema>;
export type CampaignSparklinePoint = z.infer<typeof CampaignSparklinePointSchema>;
export type CampaignDirectoryRowSummary = z.infer<typeof CampaignDirectoryRowSummarySchema>;
export type RawCampaignSourceBreakdownItem = z.infer<typeof RawCampaignSourceBreakdownItemSchema>;
export type CampaignSourceBreakdownItem = z.infer<typeof CampaignSourceBreakdownItemSchema>;
export type RawCampaignMediumBreakdownItem = z.infer<typeof RawCampaignMediumBreakdownItemSchema>;
export type CampaignMediumBreakdownItem = z.infer<typeof CampaignMediumBreakdownItemSchema>;
export type RawCampaignContentBreakdownItem = z.infer<typeof RawCampaignContentBreakdownItemSchema>;
export type CampaignContentBreakdownItem = z.infer<typeof CampaignContentBreakdownItemSchema>;
export type CampaignTrendRow = z.infer<typeof CampaignTrendRowSchema>;
export type RawCampaignTermBreakdownItem = z.infer<typeof RawCampaignTermBreakdownItemSchema>;
export type CampaignTermBreakdownItem = z.infer<typeof CampaignTermBreakdownItemSchema>;
export type RawCampaignLandingPagePerformanceItem = z.infer<typeof RawCampaignLandingPagePerformanceItemSchema>;
export type CampaignLandingPagePerformanceItem = z.infer<typeof CampaignLandingPagePerformanceItemSchema>;

export const RawCampaignDataArraySchema = z.array(RawCampaignDataSchema);
export const CampaignPerformanceArraySchema = z.array(CampaignPerformanceSchema);
export const RawCampaignSourceBreakdownArraySchema = z.array(RawCampaignSourceBreakdownItemSchema);
export const CampaignSourceBreakdownArraySchema = z.array(CampaignSourceBreakdownItemSchema);
export const RawCampaignMediumBreakdownArraySchema = z.array(RawCampaignMediumBreakdownItemSchema);
export const CampaignMediumBreakdownArraySchema = z.array(CampaignMediumBreakdownItemSchema);
export const RawCampaignContentBreakdownArraySchema = z.array(RawCampaignContentBreakdownItemSchema);
export const CampaignContentBreakdownArraySchema = z.array(CampaignContentBreakdownItemSchema);
export const CampaignTrendRowArraySchema = z.array(CampaignTrendRowSchema);
export const RawCampaignTermBreakdownArraySchema = z.array(RawCampaignTermBreakdownItemSchema);
export const CampaignTermBreakdownArraySchema = z.array(CampaignTermBreakdownItemSchema);
export const RawCampaignLandingPagePerformanceArraySchema = z.array(RawCampaignLandingPagePerformanceItemSchema);
export const CampaignLandingPagePerformanceArraySchema = z.array(CampaignLandingPagePerformanceItemSchema);
