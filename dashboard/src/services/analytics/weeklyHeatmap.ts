'server-only';

import { toDateTimeString } from '@/utils/dateFormatters';
import { HeatmapMetric, WeeklyHeatmap } from '@/entities/weeklyHeatmap';
import { QueryFilter } from '@/entities/filter';
import { getWeeklyHeatmap } from '@/repositories/clickhouse/weeklyHeatmap';

export async function getWeeklyHeatmapForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  metric: HeatmapMetric,
  queryFilters: QueryFilter[],
  tz?: string,
): Promise<WeeklyHeatmap> {
  const data = await getWeeklyHeatmap(
    siteId,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
    metric,
    queryFilters,
    tz,
  );

  return { metric, data } as WeeklyHeatmap;
}
