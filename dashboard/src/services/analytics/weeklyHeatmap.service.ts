'server-only';

import { HeatmapMetric, WeeklyHeatmap } from '@/entities/analytics/weeklyHeatmap.entities';
import { getWeeklyHeatmap } from '@/repositories/clickhouse/weeklyHeatmap.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getWeeklyHeatmapForSite(siteQuery: BASiteQuery, metric: HeatmapMetric): Promise<WeeklyHeatmap> {
  const data = await getWeeklyHeatmap(siteQuery, metric);
  return { metric, data } as WeeklyHeatmap;
}
