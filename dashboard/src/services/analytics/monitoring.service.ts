'server-only';

import {
  MonitorCheckCreate,
  MonitorCheckUpdate,
  type MonitorDailyUptime,
  type MonitorIncidentSegment,
  type MonitorMetrics,
  type MonitorOperationalState,
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
  getMonitorsWithResults,
  getMonitorUptimeBucketsForMonitors,
  getMonitorIncidentSegments,
  getLatestTlsResultsForMonitors,
  getMonitorDailyUptime,
  getRecentMonitorResults,
  getLatestCheckInfoForMonitors,
  getUptime24h,
  getLatency24h,
  getUptimeBuckets24h,
  getLatencySeries24h,
  getIncidentCount24h,
} from '@/repositories/clickhouse/monitoring.repository';
import { normalizeUptimeBuckets } from '@/presenters/toMonitorMetrics';

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
  const [openIncidents, monitorsWithResults, uptimeBuckets, tlsResults, latestCheckInfo] = await Promise.all([
    getOpenIncidentsForMonitors(checkIds, siteId),
    getMonitorsWithResults(checkIds, siteId),
    getMonitorUptimeBucketsForMonitors(checkIds, siteId),
    getLatestTlsResultsForMonitors(checkIds, siteId),
    getLatestCheckInfoForMonitors(checkIds, siteId),
  ]);

  return checks.map((check) => {
    const rawBuckets = uptimeBuckets[check.id] ?? [];
    const buckets = normalizeUptimeBuckets(rawBuckets, 24);
    const hasResults = monitorsWithResults.has(check.id);
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
  const [
    monitor,
    openIncidents,
    uptimeStats,
    latencyStats,
    uptimeBuckets,
    latencySeries,
    incidentCount,
    latestCheckInfo,
  ] = await Promise.all([
    getMonitorCheckById(dashboardId, monitorId),
    getOpenIncidentsForMonitors([monitorId], siteId),
    getUptime24h(monitorId, siteId),
    getLatency24h(monitorId, siteId),
    getUptimeBuckets24h(monitorId, siteId),
    getLatencySeries24h(monitorId, siteId),
    getIncidentCount24h(monitorId, siteId),
    getLatestCheckInfoForMonitors([monitorId], siteId).then((r) => r[monitorId] ?? null),
  ]);

  const uptime24hPercent =
    uptimeStats.totalCount > 0 ? (uptimeStats.upCount / uptimeStats.totalCount) * 100 : null;

  const hasData = latestCheckInfo?.ts != null;
  const hasOpenIncident = openIncidents.has(monitorId);
  const operationalState = deriveOperationalState(monitor?.isEnabled ?? false, hasData, hasOpenIncident);

  return {
    lastCheckAt: latestCheckInfo?.ts ?? null,
    lastStatus: latestCheckInfo?.status ?? null,
    uptime24hPercent,
    incidents24h: incidentCount,
    uptimeBuckets: normalizeUptimeBuckets(uptimeBuckets, 24),
    latency: latencyStats,
    latencySeries,
    effectiveIntervalSeconds: latestCheckInfo?.effectiveIntervalSeconds ?? null,
    backoffLevel: latestCheckInfo?.backoffLevel ?? null,
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
  errorsOnly = false,
): Promise<MonitorResult[]> {
  return getRecentMonitorResults(monitorId, siteId, limit, errorsOnly);
}

export async function fetchLatestMonitorTlsResult(
  monitorId: string,
  siteId: string,
): Promise<MonitorTlsResult | null> {
  const results = await getLatestTlsResultsForMonitors([monitorId], siteId);
  return results[monitorId] ?? null;
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
