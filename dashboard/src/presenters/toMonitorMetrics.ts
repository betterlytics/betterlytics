import { type MonitorUptimeBucket, type RawMonitorMetrics } from '@/entities/analytics/monitoring.entities';
import { parseClickHouseDate } from '@/utils/dateHelpers';

const HOUR_MS = 60 * 60 * 1000;

// Steps real hours from rangeStart, like the query's bucket grid, so DST days keep one slot per hour;
// unmonitored hours have no ratio
export function normalizeUptimeBuckets(
  data: RawMonitorMetrics['uptimeBuckets'],
  rangeStart: Date,
  placeholderCount: number,
): MonitorUptimeBucket[] {
  const bucketMap = new Map<number, MonitorUptimeBucket>(
    (data ?? []).map((point) => [parseClickHouseDateSafe(point.bucket).getTime(), point]),
  );
  const buckets: MonitorUptimeBucket[] = [];

  for (let i = 0; i < placeholderCount; i += 1) {
    const key = rangeStart.getTime() + i * HOUR_MS;
    const point = bucketMap.get(key);
    buckets.push({
      bucket: new Date(key).toISOString(),
      upRatio: point?.upRatio ?? null,
      monitoredSeconds: point?.monitoredSeconds ?? 0,
      upSeconds: point?.upSeconds ?? 0,
    });
  }

  return buckets;
}

function parseClickHouseDateSafe(value: string) {
  try {
    return parseClickHouseDate(value);
  } catch {
    return new Date(value);
  }
}
