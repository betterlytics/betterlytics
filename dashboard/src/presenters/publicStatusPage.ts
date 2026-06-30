import type { PublicMonitorStatus, PublicOverallStatus } from '@/entities/analytics/statusPage/publicStatusPage.entities';

export function deriveOverallStatus(statuses: PublicMonitorStatus[]): PublicOverallStatus {
  const known = statuses.filter((status) => status !== 'unknown');
  if (known.length === 0) return 'unknown';

  const downCount = known.filter((status) => status === 'down').length;

  // only goes full-red when EVERYTHING is down; any mix of up + down is the milder "partial outage".
  if (downCount === known.length) return 'outage'; // every monitor down -> full outage (red)
  if (downCount > 0) return 'partial_outage'; // some, but not all, down -> partial outage (orange)
  if (known.includes('degraded')) return 'degraded'; // none down, some slow -> degraded (amber)
  return 'operational';
}

export function deriveOverallUptime(uptimes: Array<number | null>): number | null {
  const known = uptimes.filter((uptime): uptime is number => uptime != null);
  if (!known.length) return null;
  return known.reduce((sum, uptime) => sum + uptime, 0) / known.length;
}
