import { type RawMonitorMetrics } from '@/entities/analytics/monitoring.entities';
import { parseClickHouseDate } from '@/utils/dateHelpers';

export function normalizeUptimeBuckets(data: RawMonitorMetrics['uptimeBuckets'], placeholderCount: number) {
  const now = new Date();
  const bucketMap = new Map<number, number | null>(
    (data ?? []).map((point) => [parseClickHouseDateSafe(point.bucket).getTime(), point.upRatio]),
  );
  const end = floorToHour(now);
  const buckets = [];

  for (let i = placeholderCount - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setHours(end.getHours() - i);
    const key = d.getTime();
    const fallback = null;
    buckets.push({ bucket: formatBucket(d), upRatio: bucketMap.get(key) ?? fallback });
  }

  return buckets;
}

function floorToHour(date: Date) {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

function formatBucket(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  const h = `${date.getHours()}`.padStart(2, '0');
  return `${y}-${m}-${d} ${h}:00:00`;
}

function parseClickHouseDateSafe(value: string) {
  try {
    return parseClickHouseDate(value);
  } catch {
    return new Date(value);
  }
}
