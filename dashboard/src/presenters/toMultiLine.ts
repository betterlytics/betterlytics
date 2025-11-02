import { CoreWebVitalName, CoreWebVitalNamedPercentilesRow } from '@/entities/webVitals';
import { parseClickHouseDate } from '@/utils/dateHelpers';

export type PercentilePoint = { date: number; value: [number, number, number, number] };
export type CoreWebVitalsSeries = Record<CoreWebVitalName, PercentilePoint[]>;

export function toNewMultiLine(
  rows: CoreWebVitalNamedPercentilesRow[],
): Record<CoreWebVitalName, PercentilePoint[]> {
  const byMetric: Record<CoreWebVitalName, Record<string, [number, number, number, number]>> = {
    CLS: {},
    LCP: {},
    INP: {},
    FCP: {},
    TTFB: {},
    '': {},
  };

  for (const r of rows) {
    if (r.name === '' || r.p50 === null || r.p75 === null || r.p90 === null || r.p99 === null) continue;
    const key = parseClickHouseDate(r.date).valueOf().toString();
    byMetric[r.name][key] = [r.p50, r.p75, r.p90, r.p99];
  }

  const result: Record<CoreWebVitalName, PercentilePoint[]> = {
    CLS: [],
    LCP: [],
    INP: [],
    FCP: [],
    TTFB: [],
    '': [],
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
