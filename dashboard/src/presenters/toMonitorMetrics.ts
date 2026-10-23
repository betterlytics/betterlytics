import { type RawMonitorMetrics } from '@/entities/analytics/monitoring.entities';
import { parseClickHouseDate } from '@/utils/dateHelpers';

const HOUR_MS = 60 * 60 * 1000;

// Steps real hours from rangeStart, like the query's bucket grid, so DST days keep one slot per hour
export function normalizeUptimeBuckets(
  data: RawMonitorMetrics['uptimeBuckets'],
  rangeStart: Date,
  placeholderCount: number,
) {
  const bucketMap = new Map<number, number | null>(
    (data ?? []).map((point) => [parseClickHouseDateSafe(point.bucket).getTime(), point.upRatio]),
  );
  const buckets = [];

  for (let i = 0; i < placeholderCount; i += 1) {
    const key = rangeStart.getTime() + i * HOUR_MS;
    buckets.push({
      bucket: new Date(key).toISOString(),
      upRatio: bucketMap.get(key) ?? null,
      totalSeconds: 60 * 60,
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
