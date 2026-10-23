import { type MonitorUptimeBucket, type RawMonitorMetrics } from '@/entities/analytics/monitoring.entities';
import { parseClickHouseDate } from '@/utils/dateHelpers';

// One bucket per hour for the last placeholderCount hours; unmonitored hours have no ratio
export function normalizeUptimeBuckets(
  data: RawMonitorMetrics['uptimeBuckets'],
  placeholderCount: number,
): MonitorUptimeBucket[] {
  const now = new Date();
  const bucketMap = new Map<number, MonitorUptimeBucket>(
    (data ?? []).map((point) => [parseClickHouseDateSafe(point.bucket).getTime(), point]),
  );
  const end = floorToHour(now);
  const buckets: MonitorUptimeBucket[] = [];

  for (let i = placeholderCount - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setHours(end.getHours() - i);
    const point = bucketMap.get(d.getTime());
    buckets.push({
      bucket: d.toISOString(),
      upRatio: point?.upRatio ?? null,
      monitoredSeconds: point?.monitoredSeconds ?? 0,
      upSeconds: point?.upSeconds ?? 0,
    });
  }

  return buckets;
}

function floorToHour(date: Date) {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

function parseClickHouseDateSafe(value: string) {
  try {
    return parseClickHouseDate(value);
  } catch {
    return new Date(value);
  }
}
