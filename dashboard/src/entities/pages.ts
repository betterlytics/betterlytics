import { z } from 'zod';

export const PageAnalyticsSchema = z.object({
  path: z.string(),
  title: z.string(),
  visitors: z.number(),
  pageviews: z.number(),
  bounceRate: z.preprocess((val) => {
    if (val === null || val === undefined) return 0;
    return Number(val);
  }, z.number()),
  avgTime: z.preprocess((val) => {
    if (val === null || val === undefined) return 0;
    return Number(val);
  }, z.number()),
  entryRate: z.number().optional(),
  exitRate: z.number().optional(),
  scrollDepthPercentage: z.preprocess((val) => {
    if (val === null || val === undefined) return 0;
    return Number(val);
  }, z.number()),
});

export const TopPageRowSchema = z.object({
  url: z.string(),
  visitors: z.number(),
});

export const TopEntryPageRowSchema = z.object({
  url: z.string(),
  visitors: z.number(),
});

export const TopExitPageRowSchema = z.object({
  url: z.string(),
  visitors: z.number(),
});

export const PageAnalyticsCombinedSchema = z.object({
  topPages: z.array(TopPageRowSchema),
  topEntryPages: z.array(TopEntryPageRowSchema),
  topExitPages: z.array(TopExitPageRowSchema),
});

export const DailyAverageTimeRowSchema = z.object({
  date: z.string(),
  avgTime: z.preprocess((val) => {
    if (val === null || val === undefined) return 0;
    return Number(val);
  }, z.number()),
});

export const DailyBounceRateRowSchema = z.object({
  date: z.string(),
  bounceRate: z.preprocess((val) => {
    if (val === null || val === undefined) return 0;
    return Number(val);
  }, z.number()),
});

export const PageviewsChartDataPointSchema = z.object({
  date: z.string(),
  views: z.number(),
});

export const PagesSummaryWithChartsSchema = z.object({
  totalPageviews: z.number(),
  avgTimeOnPage: z.number(),
  avgBounceRate: z.number(),
  pagesPerSession: z.number(),
  pagesPerSessionChartData: z.array(
    z.object({
      date: z.string(),
      value: z.number(),
    }),
  ),
  avgTimeChartData: z.array(
    z.object({
      date: z.string(),
      value: z.number(),
    }),
  ),
  bounceRateChartData: z.array(
    z.object({
      date: z.string(),
      value: z.number(),
    }),
  ),
  pageviewsChartData: z.array(PageviewsChartDataPointSchema),
});

export type PageAnalytics = z.infer<typeof PageAnalyticsSchema>;
export type TopPageRow = z.infer<typeof TopPageRowSchema>;
export type TopEntryPageRow = z.infer<typeof TopEntryPageRowSchema>;
export type TopExitPageRow = z.infer<typeof TopExitPageRowSchema>;
export type PageAnalyticsCombined = z.infer<typeof PageAnalyticsCombinedSchema>;

export type DailyAverageTimeRow = z.infer<typeof DailyAverageTimeRowSchema>;
export type DailyBounceRateRow = z.infer<typeof DailyBounceRateRowSchema>;

export type PageviewsChartDataPoint = z.infer<typeof PageviewsChartDataPointSchema>;
export type PagesSummaryWithCharts = z.infer<typeof PagesSummaryWithChartsSchema>;
