import { z } from 'zod';

export const RawCampaignDataSchema = z.object({
  utm_campaign_name: z.string(),
  total_visitors: z.number().int().nonnegative(),
  bounced_sessions: z.number().int().nonnegative(),
  total_sessions: z.number().int().nonnegative(),
  total_pageviews: z.number().int().nonnegative(),
  sum_session_duration_seconds: z.number().int().nonnegative(),
});

export const RawCampaignSourceBreakdownItemSchema = z.object({
  source: z.string(),
  total_visitors: z.number().int().nonnegative(),
  bounced_sessions: z.number().int().nonnegative(),
  total_sessions: z.number().int().nonnegative(),
  total_pageviews: z.number().int().nonnegative(),
  sum_session_duration_seconds: z.number().int().nonnegative(),
});

export const RawCampaignMediumBreakdownItemSchema = z.object({
  medium: z.string(),
  total_visitors: z.number().int().nonnegative(),
  bounced_sessions: z.number().int().nonnegative(),
  total_sessions: z.number().int().nonnegative(),
  total_pageviews: z.number().int().nonnegative(),
  sum_session_duration_seconds: z.number().int().nonnegative(),
});

export const CampaignPerformanceSchema = z.object({
  name: z.string(),
  visitors: z.number().int().nonnegative(),
  bounceRate: z.number().nonnegative(),
  avgSessionDuration: z.string(),
  pagesPerSession: z.number().nonnegative(),
});

export const CampaignSourceBreakdownItemSchema = z.object({
  source: z.string(),
  visitors: z.number().int().nonnegative(),
  bounceRate: z.number().nonnegative(),
  avgSessionDuration: z.string(),
  pagesPerSession: z.number().nonnegative(),
});

// For UTM Medium Breakdown
export const CampaignMediumBreakdownItemSchema = z.object({
  medium: z.string(),
  visitors: z.number().int().nonnegative(),
  bounceRate: z.number().nonnegative(),
  avgSessionDuration: z.string(),
  pagesPerSession: z.number().nonnegative(),
});

export const RawCampaignContentBreakdownItemSchema = z.object({
  content: z.string(),
  total_visitors: z.number().int().nonnegative(),
  bounced_sessions: z.number().int().nonnegative(),
  total_sessions: z.number().int().nonnegative(),
  total_pageviews: z.number().int().nonnegative(),
  sum_session_duration_seconds: z.number().int().nonnegative(),
});

export const CampaignContentBreakdownItemSchema = z.object({
  content: z.string(),
  visitors: z.number().int().nonnegative(),
  bounceRate: z.number().nonnegative(),
  avgSessionDuration: z.string(),
  pagesPerSession: z.number().nonnegative(),
});

export const RawCampaignTermBreakdownItemSchema = z.object({
  term: z.string(),
  total_visitors: z.number().int().nonnegative(),
  bounced_sessions: z.number().int().nonnegative(),
  total_sessions: z.number().int().nonnegative(),
  total_pageviews: z.number().int().nonnegative(),
  sum_session_duration_seconds: z.number().int().nonnegative(),
});

export const CampaignTermBreakdownItemSchema = z.object({
  term: z.string(),
  visitors: z.number().int().nonnegative(),
  bounceRate: z.number().nonnegative(),
  avgSessionDuration: z.string(),
  pagesPerSession: z.number().nonnegative(),
});

export const RawCampaignLandingPagePerformanceItemSchema = z.object({
  utm_campaign_name: z.string(),
  landing_page_url: z.string(),
  total_visitors: z.number().int().nonnegative(),
  bounced_sessions: z.number().int().nonnegative(),
  total_sessions: z.number().int().nonnegative(),
  total_pageviews: z.number().int().nonnegative(),
  sum_session_duration_seconds: z.number().int().nonnegative(),
});

export const CampaignLandingPagePerformanceItemSchema = z.object({
  campaignName: z.string(),
  landingPageUrl: z.string(),
  visitors: z.number().int().nonnegative(),
  bounceRate: z.number().nonnegative(),
  avgSessionDuration: z.string(),
  pagesPerSession: z.number().nonnegative(),
});

const CampaignVisitorValuesSchema = z.record(z.string(), z.number().nonnegative());

export const CampaignTrendRowSchema = z.object({
  date: z.string(),
  utm_campaign: z.string(),
  visitors: z.number().int().nonnegative(),
});

export type RawCampaignData = z.infer<typeof RawCampaignDataSchema>;
export type CampaignPerformance = z.infer<typeof CampaignPerformanceSchema>;
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
