import { z } from 'zod';

// Basic outbound link row schema for table display
export const OutboundLinkRowSchema = z.object({
  outbound_link_url: z.string(),
  clicks: z.number().int().min(0),
  top_source_url: z.string(),
  source_url_count: z.number().int().min(0),
  unique_visitors: z.number().int().min(0),
});

// Daily outbound clicks for time series charts
export const DailyOutboundClicksRowSchema = z.object({
  date: z.string(),
  outboundClicks: z.number().int().min(0),
});

// Summary data
export const OutboundLinkSummarySchema = z.object({
  totalClicks: z.number().int().min(0),
  uniqueVisitors: z.number().int().min(0),
  topDomain: z.string().nullable(),
  topSourceUrl: z.string().nullable(),
});

// Summary data with charts (similar to pages summary)
export const OutboundLinksSummaryWithChartsSchema = OutboundLinkSummarySchema.extend({
  dailyClicksChartData: z.array(DailyOutboundClicksRowSchema),
});

// Pie chart schema
export const TopOutboundLinksDistrubutionSchema = z.object({
  outbound_link_url: z.string(),
  clicks: z.number().int().min(0),
});

export type OutboundLinkRow = z.infer<typeof OutboundLinkRowSchema>;
export type DailyOutboundClicksRow = z.infer<typeof DailyOutboundClicksRowSchema>;
export type OutboundLinksSummary = z.infer<typeof OutboundLinkSummarySchema>;
export type OutboundLinksSummaryWithCharts = z.infer<typeof OutboundLinksSummaryWithChartsSchema>;
export type TopOutboundLinksDistrubution = z.infer<typeof TopOutboundLinksDistrubutionSchema>;
