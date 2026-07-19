import type { MonitorUptimeBucket } from './monitoring.entities';

export function weightedUptimePercent(buckets: MonitorUptimeBucket[]): number | null {
  let uptimeSeconds = 0;
  let totalSeconds = 0;
  for (const bucket of buckets) {
    if (bucket.upRatio == null || bucket.totalSeconds == null) continue;
    uptimeSeconds += bucket.upRatio * bucket.totalSeconds;
    totalSeconds += bucket.totalSeconds;
  }
  return totalSeconds > 0 ? (uptimeSeconds / totalSeconds) * 100 : null;
}
