import { z } from 'zod';

export const DailySessionMetricsRowSchema = z.object({
  date: z.string(),
  sessions: z.coerce.number(),
  bounce_rate: z.coerce.number(),
  avg_visit_duration: z.coerce.number(),
  pages_per_session: z.coerce.number(),
});

export const RangeSessionMetricsSchema = z.object({
  sessions: z.coerce.number(),
  bounce_rate: z.coerce.number(),
  avg_visit_duration: z.coerce.number(),
  pages_per_session: z.coerce.number(),
});

export type DailySessionMetricsRow = z.infer<typeof DailySessionMetricsRowSchema>;
export type RangeSessionMetrics = z.infer<typeof RangeSessionMetricsSchema>;
