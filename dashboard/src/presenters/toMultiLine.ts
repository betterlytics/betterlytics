import { GranularityRangeValues } from '@/utils/granularityRanges';
import { utcMinute } from 'd3-time';
import { CoreWebVitalName, CoreWebVitalNamedPercentilesRow } from '@/entities/webVitals';
import { getTimeIntervalForGranularityWithTimezone } from '@/utils/chartUtils';
import { parseClickHouseDate } from '@/utils/dateHelpers';

export type PercentilePoint = { date: number; value: [number, number, number, number] };
export type CoreWebVitalsSeries = Record<CoreWebVitalName, PercentilePoint[]>;

export function toPercentileLinesByMetric(
  rows: CoreWebVitalNamedPercentilesRow[],
  granularity: GranularityRangeValues,
  dateRange: { start: Date; end: Date },
  timezone: string,
): Record<CoreWebVitalName, PercentilePoint[]> {
  const byMetric: Record<CoreWebVitalName, Record<string, [number, number, number, number]>> = {
    CLS: {},
    LCP: {},
    INP: {},
    FCP: {},
    TTFB: {},
  };

  for (const r of rows) {
    const key = parseClickHouseDate(r.date).valueOf().toString();
    byMetric[r.name][key] = [r.p50, r.p75, r.p90, r.p99];
  }

  const interval = getTimeIntervalForGranularityWithTimezone(granularity, timezone);
  const start = utcMinute(dateRange.start);
  const end = utcMinute(dateRange.end);

  const result: Record<CoreWebVitalName, PercentilePoint[]> = {
    CLS: [],
    LCP: [],
    INP: [],
    FCP: [],
    TTFB: [],
  };

  for (let time = start; time <= end; time = interval.offset(time, 1)) {
    const key = time.valueOf().toString();
    (Object.keys(result) as CoreWebVitalName[]).forEach((name) => {
      const vals = byMetric[name][key] ?? [0, 0, 0, 0];
      result[name].push({ date: +key, value: vals });
    });
  }

  return result;
}
