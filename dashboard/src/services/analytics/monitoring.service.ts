'server-only';

import { toDateTimeString } from '@/utils/dateFormatters';

import {
  MonitorCheckCreate,
  MonitorCheckUpdate,
  type MonitorDailyUptime,
  type MonitorIncidentSegment,
  type MonitorMetrics,
  type MonitorOperationalState,
  type MonitorResult,
  type MonitorTlsResult,
  type MonitorUptimeBucket,
} from '@/entities/analytics/monitoring.entities';
import {
  createMonitorCheck,
  getMonitorCheckById,
  listMonitorChecks,
  updateMonitorCheck as updateMonitorCheckRepo,
  deleteMonitorCheck as deleteMonitorCheckRepo,
  monitorExistsForUrl as monitorExistsForUrlRepo,
} from '@/repositories/postgres/monitoring.repository';

import {
  getOpenIncidentsForMonitors,
  getMonitorsWithResults,
  getMonitorIncidentSegments,
  getLatestTlsResultsForMonitors,
  getRecentMonitorResults,
  getLatestCheckInfoForMonitors,
  getLatency24h,
  getLatencySeries24h,
  getIncidentCount24h,
  getLastResolvedIncidentForMonitors,
  getUptime24h,
  getUptimeBuckets24h,
  getMonitorDailyUptime,
  getIncidentSegments24h,
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

export async function checkMonitorUrlExists(
  dashboardId: string,
  url: string,
  excludeMonitorId?: string,
): Promise<boolean> {
  return monitorExistsForUrlRepo(dashboardId, url, excludeMonitorId);
}

export async function getMonitorChecksWithStatus(dashboardId: string, siteId: string, timezone: string) {
  const checks = await listMonitorChecks(dashboardId);
  const checkIds = checks.map((check) => check.id);

  // Compute 24h date range aligned to hour boundaries
  const now = new Date();
  const rangeEndDate = new Date(Math.ceil(now.getTime() / (60 * 60 * 1000)) * 60 * 60 * 1000); // Start of next hour
  const rangeStartDate = new Date(rangeEndDate.getTime() - 24 * 60 * 60 * 1000);
  const rangeStart = toDateTimeString(rangeStartDate);
  const rangeEnd = toDateTimeString(rangeEndDate);

  const [openIncidents, lastResolvedIncidents, monitorsWithResults, tlsResults, latestCheckInfo] =
    await Promise.all([
      getOpenIncidentsForMonitors(checkIds, siteId),
      getLastResolvedIncidentForMonitors(checkIds, siteId),
      getMonitorsWithResults(checkIds, siteId),
      getLatestTlsResultsForMonitors(checkIds, siteId),
      getLatestCheckInfoForMonitors(checkIds, siteId),
    ]);

  // Calculate uptime buckets for each monitor using ClickHouse
  const uptimeBuckets = await Promise.all(
    checks.map(async (check) => ({
      id: check.id,
      buckets: await getUptimeBuckets24h(check.id, siteId, check.createdAt, rangeStart, rangeEnd),
    })),
  ).then((results) =>
    results.reduce<Record<string, MonitorUptimeBucket[]>>((acc, { id, buckets }) => {
      acc[id] = buckets;
      return acc;
    }, {}),
  );

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
  timezone: string,
): Promise<MonitorMetrics> {
  const monitor = await getMonitorCheckById(dashboardId, monitorId);

  if (monitor === null) {
    throw new Error('Monitor not found');
  }

  // Compute 24h date range aligned to hour boundaries
  const now = new Date();
  const rangeEndDate = new Date(Math.ceil(now.getTime() / (60 * 60 * 1000)) * 60 * 60 * 1000); // Start of next hour
  const rangeStartDate = new Date(rangeEndDate.getTime() - 24 * 60 * 60 * 1000);
  const rangeStart = toDateTimeString(rangeStartDate);
  const rangeEnd = toDateTimeString(rangeEndDate);

  const [
    openIncidents,
    incidentSegments,
    lastResolvedIncidents,
    uptimeStats,
    latencyStats,
    uptimeBuckets,
    latencySeries,
    incidentCount,
    latestCheckInfo,
  ] = await Promise.all([
    getOpenIncidentsForMonitors([monitorId], siteId),
    getIncidentSegments24h(monitorId, siteId),
    getLastResolvedIncidentForMonitors([monitorId], siteId),
    getUptime24h(monitorId, siteId, monitor.createdAt, rangeStart, rangeEnd),
    getLatency24h(monitorId, siteId),
    getUptimeBuckets24h(monitorId, siteId, monitor.createdAt, rangeStart, rangeEnd),
    getLatencySeries24h(monitorId, siteId),
    getIncidentCount24h(monitorId, siteId),
    getLatestCheckInfoForMonitors([monitorId], siteId).then((r) => r[monitorId] ?? null),
  ]);

  const uptime24hPercent =
    uptimeStats.totalSeconds > 0 ? (uptimeStats.uptimeSeconds / uptimeStats.totalSeconds) * 100 : null;

  const hasData = latestCheckInfo?.ts != null;
  const openIncident = openIncidents.get(monitorId);
  const hasOpenIncident = openIncident != null;
  const operationalState = deriveOperationalState(monitor.isEnabled, hasData, hasOpenIncident);

  const currentStateSince = deriveCurrentStateSince(operationalState, {
    openIncident,
    lastResolvedIncident: lastResolvedIncidents.get(monitorId),
    createdAt: monitor.createdAt,
  });

  return {
    lastCheckAt: latestCheckInfo?.ts ?? null,
    lastStatus: latestCheckInfo?.status ?? null,
    uptime24hPercent,
    incidents24h: incidentCount,
    incidentSegments24h: incidentSegments,
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
  dashboardId: string,
  siteId: string,
  timezone: string,
  days = 180,
): Promise<MonitorDailyUptime[]> {
  const monitor = await getMonitorCheckById(dashboardId, monitorId);
  if (monitor === null) {
    throw new Error('Monitor not found');
  }

  // Compute date range aligned to day boundaries
  const now = new Date();
  const rangeEndDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)); // Start of next day UTC
  const rangeStartDate = new Date(rangeEndDate.getTime() - days * 24 * 60 * 60 * 1000);
  const rangeStart = toDateTimeString(rangeStartDate);
  const rangeEnd = toDateTimeString(rangeEndDate);

  return getMonitorDailyUptime(monitorId, siteId, monitor.createdAt, timezone, rangeStart, rangeEnd, days);
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
