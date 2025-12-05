'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext';
import { HeatmapMetric } from '@/entities/analytics/weeklyHeatmap';
import { QueryFilter } from '@/entities/analytics/filter';
import { getWeeklyHeatmapForSite } from '@/services/analytics/weeklyHeatmap.service';
import { toWeeklyHeatmapMatrix, type PresentedWeeklyHeatmap } from '@/presenters/toWeeklyHeatmapMatrix';

export const fetchWeeklyHeatmapAllAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date, queryFilters: QueryFilter[], tz?: string) => {
    const metrics: HeatmapMetric[] = [
      'unique_visitors',
      'pageviews',
      'sessions',
      'bounce_rate',
      'pages_per_session',
      'session_duration',
    ];

    const results = await Promise.all(
      metrics.map((metric) => getWeeklyHeatmapForSite(ctx.siteId, startDate, endDate, metric, queryFilters, tz)),
    );

    return metrics.map(
      (metric, i) => [metric, toWeeklyHeatmapMatrix(results[i].data)] as [HeatmapMetric, PresentedWeeklyHeatmap],
    );
  },
);
