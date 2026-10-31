'server-only';

import type { DashboardAlerts } from '@/entities/analytics/dashboardAlerts.entities';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { listMonitorChecks } from '@/repositories/postgres/monitoring.repository';
import { countUnresolvedIncidents } from '@/repositories/postgres/statusPageIncident.repository';
import { getOpenIncidentsForMonitors } from '@/repositories/clickhouse/monitoring.repository';

async function hasDownMonitors(dashboardId: string, siteId: string): Promise<boolean> {
  // Paused monitors count as paused even with an outage left open, matching the Monitoring page.
  const activeCheckIds = (await listMonitorChecks(dashboardId))
    .filter((check) => check.isEnabled)
    .map((check) => check.id);
  return (await getOpenIncidentsForMonitors(activeCheckIds, siteId)).size > 0;
}

export async function getDashboardAlerts(dashboardId: string, siteId: string): Promise<DashboardAlerts> {
  const [downMonitors, unresolvedIncidents] = await Promise.all([
    isFeatureEnabled('enableUptimeMonitoring') ? hasDownMonitors(dashboardId, siteId) : false,
    isFeatureEnabled('enablePublicStatusPages') ? countUnresolvedIncidents(dashboardId) : 0,
  ]);

  return { hasDownMonitors: downMonitors, hasUnresolvedStatusPageIncidents: unresolvedIncidents > 0 };
}
