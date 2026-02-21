'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { HeatmapMetric } from '@/entities/analytics/weeklyHeatmap.entities';
import { getWeeklyHeatmapForSite } from '@/services/analytics/weeklyHeatmap.service';
import { toWeeklyHeatmapMatrix, type PresentedWeeklyHeatmap } from '@/presenters/toWeeklyHeatmapMatrix';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export const fetchWeeklyHeatmapAllAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main } = toSiteQuery(ctx.siteId, query);

    const metrics: HeatmapMetric[] = [
      'unique_visitors',
      'pageviews',
      'sessions',
      'bounce_rate',
      'pages_per_session',
      'session_duration',
    ];

    const results = await Promise.all(metrics.map((metric) => getWeeklyHeatmapForSite(main, metric)));

    return metrics.map(
      (metric, i) => [metric, toWeeklyHeatmapMatrix(results[i].data)] as [HeatmapMetric, PresentedWeeklyHeatmap],
    );
  },
);
