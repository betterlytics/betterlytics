'server-only';

import {
  MonitorCheckCreate,
  MonitorCheckUpdate,
  MonitorOperationalState,
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
  deleteMonitorCheck as deleteMonitorCheckRepo,
  monitorExistsForHostname as monitorExistsForHostnameRepo,
} from '@/repositories/postgres/monitoring.repository';

import {
  getOpenIncidentsForMonitors,
  getMonitorUptimeBucketsForMonitors,
  getMonitorIncidentSegments,
  getLatestTlsResult,
  getLatestTlsResultsForMonitors,
  getMonitorDailyUptime,
  getMonitorMetrics,
  getRecentMonitorResults,
  getLatestCheckInfoForMonitors,
} from '@/repositories/clickhouse/monitoring.repository';
import { normalizeUptimeBuckets, toMonitorMetricsPresentation } from '@/presenters/toMonitorMetrics';

export async function getMonitorCheck(dashboardId: string, monitorId: string) {
  return getMonitorCheckById(dashboardId, monitorId);
}

export async function addMonitorCheck(dashboardId: string, input: MonitorCheckCreate) {
  return createMonitorCheck(dashboardId, input);
}

export async function updateMonitorCheck(dashboardId: string, input: MonitorCheckUpdate) {
  return updateMonitorCheckRepo(dashboardId, input);
}

export async function deleteMonitorCheck(dashboardId: string, monitorId: string) {
  return deleteMonitorCheckRepo(dashboardId, monitorId);
}

export async function checkMonitorHostnameExists(
  dashboardId: string,
  url: string,
  excludeMonitorId?: string,
): Promise<boolean> {
  return monitorExistsForHostnameRepo(dashboardId, url, excludeMonitorId);
}

export async function getMonitorChecksWithStatus(dashboardId: string, siteId: string) {
  const checks = await listMonitorChecks(dashboardId);
  const checkIds = checks.map((check) => check.id);
  const now = new Date();
  const [openIncidents, uptimeBuckets, tlsResults, latestCheckInfo] = await Promise.all([
    getOpenIncidentsForMonitors(checkIds, siteId),
    getMonitorUptimeBucketsForMonitors(checkIds, siteId),
    getLatestTlsResultsForMonitors(checkIds, siteId),
    getLatestCheckInfoForMonitors(checkIds, siteId),
  ]);

  return checks.map((check) => {
    const rawBuckets = uptimeBuckets[check.id] ?? [];
    const buckets = normalizeUptimeBuckets(rawBuckets, 24, now);
    const hasResults = rawBuckets.length > 0;
    const hasOpenIncident = openIncidents.has(check.id);
    const operationalState = deriveOperationalState(check.isEnabled, hasResults, hasOpenIncident);
    const checkInfo = latestCheckInfo[check.id];

    return {
      ...check,
      hasOpenIncident,
      effectiveIntervalSeconds: checkInfo?.effectiveIntervalSeconds ?? null,
      backoffLevel: checkInfo?.backoffLevel ?? null,
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
  const [monitor, rawMetrics, openIncidents] = await Promise.all([
    getMonitorCheckById(dashboardId, monitorId),
    getMonitorMetrics(monitorId, siteId),
    getOpenIncidentsForMonitors([monitorId], siteId),
  ]);

  const metrics = toMonitorMetricsPresentation(rawMetrics);
  const hasData = metrics.lastCheckAt != null;
  const hasOpenIncident = openIncidents.has(monitorId);
  const operationalState = deriveOperationalState(monitor?.isEnabled ?? false, hasData, hasOpenIncident);

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
 * 2. Open incident -> down
 * 3. No data/results -> preparing
 * 4. Otherwise -> up
 */
function deriveOperationalState(
  isEnabled: boolean,
  hasData: boolean,
  hasOpenIncident: boolean,
): MonitorOperationalState {
  if (!isEnabled) return 'paused';
  if (hasOpenIncident) return 'down';
  if (!hasData) return 'preparing';
  return 'up';
}
