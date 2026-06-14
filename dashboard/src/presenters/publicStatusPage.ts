import type { PublicMonitorStatus, PublicOverallStatus } from '@/entities/analytics/statusPage.entities';

export function deriveOverallStatus(statuses: PublicMonitorStatus[]): PublicOverallStatus {
  if (statuses.includes('down')) return 'outage';
  if (statuses.includes('degraded')) return 'degraded';
  if (statuses.includes('operational')) return 'operational';
  return 'unknown';
}

export function deriveOverallUptime(uptimes: Array<number | null>): number | null {
  const known = uptimes.filter((uptime): uptime is number => uptime != null);
  if (!known.length) return null;
  return known.reduce((sum, uptime) => sum + uptime, 0) / known.length;
}
