import {
  CORE_WEB_VITAL_NAMES,
  CoreWebVitalName,
  CoreWebVitalNamedPercentilesRow,
} from '@/entities/analytics/webVitals.entities';
import { parseClickHouseDate } from '@/utils/dateHelpers';

type Percentiles = [number | null, number | null, number | null, number | null];
export type PercentilePoint = { date: number; value: Percentiles };
export type CoreWebVitalsSeries = Record<CoreWebVitalName, PercentilePoint[]>;

export function toWebVitalsPercentileChart(rows: CoreWebVitalNamedPercentilesRow[]): CoreWebVitalsSeries {
  const periods = new Set<number>();
  const byMetric = Object.fromEntries(
    CORE_WEB_VITAL_NAMES.map((name) => [name, new Map<number, Percentiles>()]),
  ) as Record<CoreWebVitalName, Map<number, Percentiles>>;

  for (const row of rows) {
    const date = parseClickHouseDate(row.date).valueOf();
    periods.add(date);
    // Rows without a name are the query's period filling: they add a period, not samples
    if (row.name !== '') {
      byMetric[row.name].set(date, [row.p50, row.p75, row.p90, row.p99]);
    }
  }

  const timeline = [...periods].sort((a, b) => a - b);

  return Object.fromEntries(
    CORE_WEB_VITAL_NAMES.map((name) => [
      name,
      timeline.map((date) => ({ date, value: byMetric[name].get(date) ?? [null, null, null, null] })),
    ]),
  ) as CoreWebVitalsSeries;
}
