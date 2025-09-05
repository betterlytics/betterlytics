import { z } from 'zod';

export const HeatmapMetricSchema = z.enum([
  'pageviews',
  'unique_visitors',
  'sessions',
  'bounce_rate',
  'pages_per_session',
  'session_duration',
]);

export type HeatmapMetric = z.infer<typeof HeatmapMetricSchema>;

export const WeeklyHeatmapRowSchema = z.object({
  // ISO date truncated to hour for the bucket start (mainly for traceability)
  date: z.string(),
  // 1-7 where 1 = Monday, 7 = Sunday (ClickHouse toDayOfWeek ISO mapping)
  weekday: z.number().int().min(1).max(7),
  // 0-23 hour of day
  hour: z.number().int().min(0).max(23),
  value: z.number(),
});

export type WeeklyHeatmapRow = z.infer<typeof WeeklyHeatmapRowSchema>;

export const WeeklyHeatmapSchema = z.object({
  metric: HeatmapMetricSchema,
  data: z.array(WeeklyHeatmapRowSchema),
});

export type WeeklyHeatmap = z.infer<typeof WeeklyHeatmapSchema>;
