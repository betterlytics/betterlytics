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
  getLastResolvedIncidentForMonitors,
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
  const [openIncidents, lastResolvedIncidents, monitorsWithResults, uptimeBuckets, tlsResults, latestCheckInfo] =
    await Promise.all([
      getOpenIncidentsForMonitors(checkIds, siteId),
      getLastResolvedIncidentForMonitors(checkIds, siteId),
      getMonitorsWithResults(checkIds, siteId),
      getMonitorUptimeBucketsForMonitors(checkIds, siteId),
      getLatestTlsResultsForMonitors(checkIds, siteId),
      getLatestCheckInfoForMonitors(checkIds, siteId),
    ]);

  return checks.map((check) => {
    const rawBuckets = uptimeBuckets[check.id] ?? [];
    const buckets = normalizeUptimeBuckets(rawBuckets, 24);
    const hasResults = monitorsWithResults.has(check.id);
    const openIncident = openIncidents.get(check.id);
    const hasOpenIncident = openIncident != null;
    const operationalState = deriveOperationalState(check.isEnabled, hasResults, hasOpenIncident);
    const checkInfo = latestCheckInfo[check.id];

    const currentStateSince = deriveCurrentStateSince(operationalState, {
      openIncident,
      lastResolvedIncident: lastResolvedIncidents.get(check.id),
      createdAt: check.createdAt,
    });

    return {
      ...check,
      hasOpenIncident,
      effectiveIntervalSeconds: checkInfo?.effectiveIntervalSeconds ?? null,
      backoffLevel: checkInfo?.backoffLevel ?? null,
      uptimeBuckets: buckets,
      tls: tlsResults[check.id] ?? null,
      operationalState,
      currentStateSince,
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
    lastResolvedIncidents,
    uptimeStats,
    latencyStats,
    uptimeBuckets,
    latencySeries,
    incidentCount,
    latestCheckInfo,
  ] = await Promise.all([
    getMonitorCheckById(dashboardId, monitorId),
    getOpenIncidentsForMonitors([monitorId], siteId),
    getLastResolvedIncidentForMonitors([monitorId], siteId),
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
  const openIncident = openIncidents.get(monitorId);
  const hasOpenIncident = openIncident != null;
  const operationalState = deriveOperationalState(monitor?.isEnabled ?? false, hasData, hasOpenIncident);

  const currentStateSince = deriveCurrentStateSince(operationalState, {
    openIncident,
    lastResolvedIncident: lastResolvedIncidents.get(monitorId),
    createdAt: monitor?.createdAt ?? null,
  });

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
    currentStateSince,
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

function deriveCurrentStateSince(
  operationalState: MonitorOperationalState,
  {
    openIncident,
    lastResolvedIncident,
    createdAt,
  }: {
    openIncident?: { startedAt: string } | null;
    lastResolvedIncident?: { resolvedAt: string } | null;
    createdAt?: Date | null;
  },
): string | null {
  if (operationalState === 'down' && openIncident) {
    return openIncident.startedAt;
  }

  if (operationalState === 'up') {
    return lastResolvedIncident?.resolvedAt ?? createdAt?.toISOString() ?? null;
  }

  return null;
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
