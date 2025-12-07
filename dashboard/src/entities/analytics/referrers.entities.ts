import { z } from 'zod';

export const ReferrerSourceAggregationSchema = z.object({
  referrer_source: z.string(),
  visitorCount: z.number().int().min(0),
});

export const ReferrerTrafficBySourceRowSchema = z.object({
  date: z.string(),
  referrer_source: z.string(),
  count: z.number(),
});

export const DailyReferralSessionsRowSchema = z.object({
  date: z.string(),
  referralSessions: z.number(),
});

export const DailyReferralPercentageRowSchema = z.object({
  date: z.string(),
  referralPercentage: z.number(),
});

export const DailyReferralSessionDurationRowSchema = z.object({
  date: z.string(),
  avgSessionDuration: z.number(),
});

export const ReferrerSummaryWithChartsSchema = z.object({
  referralSessions: z.number().int().min(0),
  totalSessions: z.number().int().min(0),
  topReferrerSource: z.string().nullable(),
  avgSessionDuration: z.number().min(0),
  referralSessionsChartData: z.array(DailyReferralSessionsRowSchema),
  referralPercentageChartData: z.array(DailyReferralPercentageRowSchema),
  avgSessionDurationChartData: z.array(DailyReferralSessionDurationRowSchema),
});

export const ReferrerTableRowSchema = z.object({
  source_type: z.string(),
  source_name: z.string(),
  source_url: z.string(),
  visits: z.number().int().min(0),
  bounce_rate: z.number().min(0),
  avg_visit_duration: z.number().min(0),
});

export const TopReferrerUrlSchema = z.object({
  referrer_url: z.string(),
  visits: z.number().int(),
});

export const TopChannelSchema = z.object({
  channel: z.string(),
  visits: z.number().int(),
});

export const TopReferrerSourceSchema = z.object({
  referrer_source: z.string(),
  visits: z.number().int(),
});

export const TrafficSourcesCombinedSchema = z.object({
  topReferrerUrls: z.array(TopReferrerUrlSchema),
  topReferrerSources: z.array(TopReferrerSourceSchema),
  topChannels: z.array(TopChannelSchema),
});

export type ReferrerSourceAggregation = z.infer<typeof ReferrerSourceAggregationSchema>;
export type ReferrerTrafficBySourceRow = z.infer<typeof ReferrerTrafficBySourceRowSchema>;
export type DailyReferralSessionsRow = z.infer<typeof DailyReferralSessionsRowSchema>;
export type DailyReferralPercentageRow = z.infer<typeof DailyReferralPercentageRowSchema>;
export type DailyReferralSessionDurationRow = z.infer<typeof DailyReferralSessionDurationRowSchema>;
export type ReferrerSummaryWithCharts = z.infer<typeof ReferrerSummaryWithChartsSchema>;
export type ReferrerTableRow = z.infer<typeof ReferrerTableRowSchema>;
export type TopReferrerUrl = z.infer<typeof TopReferrerUrlSchema>;
export type TopChannel = z.infer<typeof TopChannelSchema>;
export type TopReferrerSource = z.infer<typeof TopReferrerSourceSchema>;
export type TrafficSourcesCombined = z.infer<typeof TrafficSourcesCombinedSchema>;
