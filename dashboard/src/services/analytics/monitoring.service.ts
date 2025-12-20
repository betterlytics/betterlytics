'server-only';

import {
  MonitorCheckCreate,
  MonitorCheckUpdate,
  MonitorOperationalState,
  MonitorStatus,
  type MonitorDailyUptime,
  type MonitorIncidentSegment,
  type MonitorMetrics,
  type MonitorResult,
  type MonitorTlsResult,
} from '@/entities/analytics/monitoring.entities';
import {
  createMonitorCheck,
  getMonitorCheckById,
  listMonitorChecks,
  updateMonitorCheck as updateMonitorCheckRepo,
} from '@/repositories/postgres/monitoring.repository';

import {
  getLatestIncidentsForMonitors,
  getMonitorUptimeBucketsForMonitors,
  getMonitorIncidentSegments,
  getLatestTlsResult,
  getLatestTlsResultsForMonitors,
  getMonitorDailyUptime,
  getMonitorMetrics,
  getRecentMonitorResults,
} from '@/repositories/clickhouse/monitoring.repository';
import { normalizeUptimeBuckets, toMonitorMetricsPresentation } from '@/presenters/toMonitorMetrics';

export async function getMonitorCheck(dashboardId: string, monitorId: string) {
  return getMonitorCheckById(dashboardId, monitorId);
}

export async function addMonitorCheck(input: MonitorCheckCreate) {
  return createMonitorCheck(input);
}

export async function updateMonitorCheck(input: MonitorCheckUpdate) {
  return updateMonitorCheckRepo(input);
}

export async function getMonitorChecksWithStatus(dashboardId: string, siteId: string) {
  const checks = await listMonitorChecks(dashboardId);
  const checkIds = checks.map((check) => check.id);
  const now = new Date();
  const [latestIncidents, uptimeBuckets, tlsResults] = await Promise.all([
    getLatestIncidentsForMonitors(checkIds, siteId),
    getMonitorUptimeBucketsForMonitors(checkIds, siteId),
    getLatestTlsResultsForMonitors(checkIds, siteId),
  ]);

  return checks.map((check) => {
    const incident = latestIncidents[check.id];
    const rawBuckets = uptimeBuckets[check.id] ?? [];
    const buckets = normalizeUptimeBuckets(rawBuckets, 24, now);
    const hasResults = rawBuckets.length > 0;
    const operationalState = deriveOperationalState(check.isEnabled, hasResults, { incident });
    const incidentState = incident?.state ?? null;

    return {
      ...check,
      lastStatus: (incident?.lastStatus as MonitorStatus) ?? null,
      incidentState,
      effectiveIntervalSeconds: null, // fetch from results if needed
      backoffLevel: null,
      uptimeBuckets: buckets,
      tls: tlsResults[check.id] ?? null,
      operationalState,
    };
  });
}

export async function fetchMonitorMetrics(
  dashboardId: string,
  monitorId: string,
  siteId: string,
): Promise<MonitorMetrics> {
  const [monitor, rawMetrics] = await Promise.all([
    getMonitorCheckById(dashboardId, monitorId),
    getMonitorMetrics(monitorId, siteId),
  ]);

  const metrics = toMonitorMetricsPresentation(rawMetrics);
  const hasData = metrics.lastCheckAt != null;
  const operationalState = deriveOperationalState(monitor?.isEnabled ?? false, hasData, {
    lastStatus: metrics.lastStatus,
  });

  return {
    ...metrics,
    operationalState,
  };
}

export async function fetchMonitorDailyUptime(
  monitorId: string,
  siteId: string,
  days = 180,
): Promise<MonitorDailyUptime[]> {
  return getMonitorDailyUptime(monitorId, siteId, days);
}

export async function fetchRecentMonitorResults(
  monitorId: string,
  siteId: string,
  limit = 20,
): Promise<MonitorResult[]> {
  return getRecentMonitorResults(monitorId, siteId, limit);
}

export async function fetchLatestMonitorTlsResult(
  monitorId: string,
  siteId: string,
): Promise<MonitorTlsResult | null> {
  return getLatestTlsResult(monitorId, siteId);
}

export async function fetchMonitorIncidentSegments(
  monitorId: string,
  siteId: string,
  days = 7,
  limit = 5,
): Promise<MonitorIncidentSegment[]> {
  return getMonitorIncidentSegments(monitorId, siteId, days, limit);
}

/**
 * Derives the operational state from monitor data.
 *
 * Logic priority:
 * 1. Disabled -> paused
 * 2. No data/results -> preparing
 * 3. Open incident -> down or degraded (based on incident.lastStatus)
 * 4. Resolved/no incident with lastStatus -> derive from lastStatus
 * 5. No incident and has data -> up
 */
function deriveOperationalState(
  isEnabled: boolean,
  hasData: boolean,
  options?: {
    incident?: { state: string; lastStatus: string | null };
    lastStatus?: MonitorStatus | null;
  },
): MonitorOperationalState {
  if (!isEnabled) return 'paused';
  if (!hasData) return 'preparing';

  const incident = options?.incident;

  // If there's an open incident, use its severity
  if (incident?.state === 'open') {
    return incident.lastStatus === 'warn' ? 'degraded' : 'down';
  }

  // If we have a lastStatus (from metrics in detail view), use it
  const lastStatus = options?.lastStatus;
  if (lastStatus) {
    switch (lastStatus) {
      case 'ok':
        return 'up';
      case 'warn':
        return 'degraded';
      case 'down':
      case 'error':
        return 'down';
    }
  }

  // No open incident and have data -> healthy
  return 'up';
}
