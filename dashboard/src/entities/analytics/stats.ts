import { z } from 'zod';
import { DailyUniqueVisitorsRowSchema } from './visitors';
import { TotalPageViewRowSchema } from './pageviews';
import { DailySessionMetricsRowSchema } from './sessionMetrics';

export const SummaryStatsWithChartsSchema = z.object({
  uniqueVisitors: z.number(),
  pageviews: z.number(),
  sessions: z.number(),
  bounceRate: z.number(),
  avgVisitDuration: z.number(),
  pagesPerSession: z.number(),
  visitorsChartData: z.array(DailyUniqueVisitorsRowSchema),
  pageviewsChartData: z.array(TotalPageViewRowSchema),
  sessionsChartData: z.array(DailySessionMetricsRowSchema),
  bounceRateChartData: z.array(DailySessionMetricsRowSchema),
  avgVisitDurationChartData: z.array(DailySessionMetricsRowSchema),
  pagesPerSessionChartData: z.array(DailySessionMetricsRowSchema),
});

export type SummaryStatsWithCharts = z.infer<typeof SummaryStatsWithChartsSchema>;
