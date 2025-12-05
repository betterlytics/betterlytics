import { CoreWebVitalName, CoreWebVitalNamedPercentilesRow } from '@/entities/analytics/webVitals';
import { getDateKey } from '@/utils/dateHelpers';

export type PercentilePoint = { date: number; value: [number, number, number, number] };
export type CoreWebVitalsSeries = Record<CoreWebVitalName, PercentilePoint[]>;

export function toWebVitalsPercentileChart(
  rows: CoreWebVitalNamedPercentilesRow[],
): Record<CoreWebVitalName, PercentilePoint[]> {
  const byMetric: Record<CoreWebVitalName, Record<string, [number, number, number, number]>> = {
    CLS: {},
    LCP: {},
    INP: {},
    FCP: {},
    TTFB: {},
  };

  for (const r of rows) {
    const key = getDateKey(r.date);
    const value: [number, number, number, number] = [r.p50 ?? 0, r.p75 ?? 0, r.p90 ?? 0, r.p99 ?? 0];

    if (r.name !== '') {
      byMetric[r.name][key] = value;
    } else {
      (Object.keys(byMetric) as CoreWebVitalName[]).forEach((name) => {
        byMetric[name][key] = value;
      });
    }
  }

  const result: Record<CoreWebVitalName, PercentilePoint[]> = {
    CLS: [],
    LCP: [],
    INP: [],
    FCP: [],
    TTFB: [],
  };

  (Object.keys(result) as CoreWebVitalName[]).forEach((name) => {
    const keys = Object.keys(byMetric[name])
      .map((k) => Number(k))
      .sort((a, b) => a - b);
    for (const ts of keys) {
      const vals = byMetric[name][String(ts)] ?? [0, 0, 0, 0];
      result[name].push({ date: ts, value: vals });
    }
  });

  return result;
}
