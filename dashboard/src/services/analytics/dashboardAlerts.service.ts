'server-only';

import type { DashboardAlerts, DownMonitorAlert } from '@/entities/analytics/dashboardAlerts.entities';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { listMonitorChecks } from '@/repositories/postgres/monitoring.repository';
import { listUnresolvedIncidents } from '@/repositories/postgres/statusPageIncident.repository';
import { getOpenIncidentsForMonitors } from '@/repositories/clickhouse/monitoring.repository';

async function getDownMonitors(dashboardId: string, siteId: string): Promise<DownMonitorAlert[]> {
  // Paused monitors count as paused even with an outage left open, matching the Monitoring page.
  const activeChecks = (await listMonitorChecks(dashboardId)).filter((check) => check.isEnabled);
  const openIncidents = await getOpenIncidentsForMonitors(
    activeChecks.map((check) => check.id),
    siteId,
  );

  return activeChecks.flatMap((check) => {
    const incident = openIncidents.get(check.id);
    if (!incident) return [];
    return [{ monitorId: check.id, incidentId: incident.incidentId }];
  });
}

export async function getDashboardAlerts(dashboardId: string, siteId: string): Promise<DashboardAlerts> {
  const [downMonitors, statusPageIncidents] = await Promise.all([
    isFeatureEnabled('enableUptimeMonitoring') ? getDownMonitors(dashboardId, siteId) : [],
    isFeatureEnabled('enablePublicStatusPages') ? listUnresolvedIncidents(dashboardId) : [],
  ]);

  return { downMonitors, statusPageIncidents };
}
