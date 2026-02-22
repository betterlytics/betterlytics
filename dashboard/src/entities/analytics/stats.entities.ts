import { z } from 'zod';
import { DailyUniqueVisitorsRowSchema } from './visitors.entities';
import { TotalPageViewRowSchema } from './pageviews.entities';
import { DailySessionMetricsRowSchema } from './sessionMetrics.entities';

export const SummaryStatsWithChartsSchema = z.object({
  uniqueVisitors: z.coerce.number(),
  pageviews: z.coerce.number(),
  sessions: z.coerce.number(),
  bounceRate: z.coerce.number(),
  avgVisitDuration: z.coerce.number(),
  pagesPerSession: z.coerce.number(),
  visitorsChartData: z.array(DailyUniqueVisitorsRowSchema),
  pageviewsChartData: z.array(TotalPageViewRowSchema),
  sessionsChartData: z.array(DailySessionMetricsRowSchema),
  bounceRateChartData: z.array(DailySessionMetricsRowSchema),
  avgVisitDurationChartData: z.array(DailySessionMetricsRowSchema),
  pagesPerSessionChartData: z.array(DailySessionMetricsRowSchema),
});

export type SummaryStatsWithCharts = z.infer<typeof SummaryStatsWithChartsSchema>;
