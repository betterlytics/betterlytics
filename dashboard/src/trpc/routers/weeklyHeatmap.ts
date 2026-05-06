import { z } from 'zod';
import { createRouter, analyticsProcedure } from '@/trpc/init';
import { HeatmapMetricSchema, type HeatmapMetric } from '@/entities/analytics/weeklyHeatmap.entities';
import { getWeeklyHeatmapForSite } from '@/services/analytics/weeklyHeatmap.service';
import { toWeeklyHeatmapMatrix } from '@/presenters/toWeeklyHeatmapMatrix';

export const weeklyHeatmapRouter = createRouter({
  heatmap: analyticsProcedure
    .input(z.object({ metric: HeatmapMetricSchema }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      const result = await getWeeklyHeatmapForSite(main, input.metric);
      return toWeeklyHeatmapMatrix(result.data);
    }),

  heatmapAll: analyticsProcedure.query(async ({ ctx }) => {
    const { main } = ctx;
    const metrics: HeatmapMetric[] = [
      'unique_visitors', 'pageviews', 'sessions', 'bounce_rate', 'pages_per_session', 'session_duration',
    ];
    const results = await Promise.all(metrics.map((metric) => getWeeklyHeatmapForSite(main, metric)));
    return metrics.map((metric, i) => [metric, toWeeklyHeatmapMatrix(results[i].data)] as const);
  }),
});
