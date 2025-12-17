'server-only';

import {
  MonitorCheckCreate,
  MonitorCheckUpdate,
  MonitorOperationalState,
  MonitorStatus,
  deriveOperationalState,
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
import {
  type MonitorDailyUptime,
  type MonitorIncidentSegment,
  type MonitorMetrics,
  type MonitorResult,
  type MonitorTlsResult,
} from '@/entities/analytics/monitoring.entities';
import { normalizeUptimeBuckets, toMonitorMetricsPresentation } from '@/presenters/toMonitorMetrics';

export async function getMonitorChecks(dashboardId: string) {
  return listMonitorChecks(dashboardId);
}

export async function getMonitorCheck(dashboardId: string, monitorId: string) {
  return getMonitorCheckById(dashboardId, monitorId);
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
    const lastStatus = (incident?.lastStatus as MonitorStatus | null | undefined) ?? null;
    const incidentState = incident?.state ?? null;
    const buckets = normalizeUptimeBuckets(uptimeBuckets[check.id] ?? [], 24, now);
    const hasData = buckets.length > 0;
    const effectiveIntervalSeconds = incident?.lastEventAt ? check.intervalSeconds : null;

    const operationalState: MonitorOperationalState = incidentState
      ? mapIncidentToOperationalState(check.isEnabled, incidentState, lastStatus, hasData)
      : deriveOperationalState(check.isEnabled, lastStatus, hasData);

    return {
      ...check,
      lastStatus,
      incidentState,
      effectiveIntervalSeconds,
      backoffLevel: null,
      uptimeBuckets: buckets,
      tls: tlsResults[check.id] ?? null,
      operationalState,
    };
  });
}

function mapIncidentToOperationalState(
  isEnabled: boolean,
  incidentState: string | null,
  lastStatus: MonitorStatus | null,
  hasData: boolean,
): MonitorOperationalState {
  if (!isEnabled) return 'paused';
  if (!incidentState) return deriveOperationalState(isEnabled, lastStatus, hasData);

  switch (incidentState) {
    case 'muted':
      return 'paused';
    case 'flapping':
      return 'degraded';
    case 'open':
      if (lastStatus === 'error') return 'error';
      if (lastStatus === 'warn') return 'degraded';
      return 'down';
    case 'resolved':
      return 'up';
    default:
      return deriveOperationalState(isEnabled, lastStatus, hasData);
  }
}

export async function addMonitorCheck(input: MonitorCheckCreate) {
  return createMonitorCheck(input);
}

export async function updateMonitorCheck(input: MonitorCheckUpdate) {
  return updateMonitorCheckRepo(input);
}

export async function fetchMonitorMetrics(monitorId: string, siteId: string): Promise<MonitorMetrics> {
  const metrics = await getMonitorMetrics(monitorId, siteId);
  return toMonitorMetricsPresentation(metrics);
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
