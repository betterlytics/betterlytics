import { type RawMonitorMetrics } from '@/entities/analytics/monitoring.entities';
import { parseClickHouseDate } from '@/utils/dateHelpers';

export function normalizeUptimeBuckets(data: RawMonitorMetrics['uptimeBuckets'], placeholderCount: number) {
  const now = new Date();
  const bucketMap = new Map(
    (data ?? []).map((point) => [parseClickHouseDateSafe(point.bucket).getTime(), point] as const),
  );
  const end = floorToHour(now);
  const buckets = [];

  for (let i = placeholderCount - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setHours(end.getHours() - i);
    const key = d.getTime();
    const point = bucketMap.get(key);
    // Paused time is left out of a bucket's monitored seconds, so keep them for weighting.
    buckets.push({
      bucket: d.toISOString(),
      upRatio: point?.upRatio ?? null,
      totalSeconds: point?.totalSeconds ?? 60 * 60,
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
