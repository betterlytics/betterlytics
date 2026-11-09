'server-only';

import moment from 'moment-timezone';
import { toDateTimeString } from '@/utils/dateFormatters';

import {
  type MonitorCheck,
  MonitorCheckCreate,
  MonitorCheckUpdate,
  type IncidentState,
  type MonitorDailyUptime,
  type MonitorIncidentSegment,
  type MonitorIncidentWithMonitor,
  type MonitorMetrics,
  type MonitorOperationalState,
  type MonitorRangeSummary,
  type MonitorResult,
  type MonitorTlsResult,
} from '@/entities/analytics/monitoring.entities';
import { summarizeUptime } from '@/entities/analytics/monitoring.helpers';
import {
  createMonitorCheck,
  getMonitorCheckById,
  listMonitorChecks,
  countMonitorChecks as countMonitorChecksRepo,
  updateMonitorCheck as updateMonitorCheckRepo,
  deleteMonitorCheck as deleteMonitorCheckRepo,
  monitorExistsForUrl as monitorExistsForUrlRepo,
  getMonitorDeletionImpact as getMonitorDeletionImpactRepo,
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
  getLatencyStatsForMonitors,
  getMonitorIncidentsInRange,
  getIncidentSegments24h,
  getUptimeBuckets,
  type UptimeMonitorRef,
} from '@/repositories/clickhouse/monitoring.repository';
import { normalizeUptimeBuckets } from '@/presenters/toMonitorMetrics';
import { formatDayKey } from '@/utils/timezone';

function toUptimeMonitorRef(check: Pick<MonitorCheck, 'id' | 'createdAt'>): UptimeMonitorRef {
  return { checkId: check.id, createdAt: check.createdAt };
}

// The last 24 real hours on the zone's hour boundaries, ending after the zone's current hour, in hourly buckets
async function getUptimeBuckets24h(
  checks: Array<Pick<MonitorCheck, 'id' | 'createdAt'>>,
  siteId: string,
  timezone: string,
) {
  const rangeEnd = moment.tz(timezone).startOf('hour').add(1, 'hour');
  const rangeStart = rangeEnd.clone().subtract(24, 'hours').toDate();
  const buckets = await getUptimeBuckets(checks.map(toUptimeMonitorRef), siteId, {
    rangeStart,
    rangeEnd: rangeEnd.toDate(),
    granularity: 'hour',
    timezone,
  });
  return { rangeStart, buckets };
}

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

export async function getMonitorDeletionImpact(dashboardId: string, monitorId: string) {
  const monitor = await getMonitorCheckById(dashboardId, monitorId);
  if (!monitor) throw new Error('Monitor not found');
  return getMonitorDeletionImpactRepo(dashboardId, monitorId);
}

export async function checkMonitorUrlExists(
  dashboardId: string,
  url: string,
  excludeMonitorId?: string,
): Promise<boolean> {
  return monitorExistsForUrlRepo(dashboardId, url, excludeMonitorId);
}

export async function countMonitorChecks(dashboardId: string): Promise<number> {
  return countMonitorChecksRepo(dashboardId);
}

export async function getMonitorChecksWithStatus(dashboardId: string, siteId: string, timezone: string) {
  const checks = await listMonitorChecks(dashboardId);
  const checkIds = checks.map((check) => check.id);

  const [openIncidents, lastResolvedIncidents, monitorsWithResults, tlsResults, latestCheckInfo, uptime24h] =
    await Promise.all([
      getOpenIncidentsForMonitors(checkIds, siteId),
      getLastResolvedIncidentForMonitors(checkIds, siteId),
      getMonitorsWithResults(checkIds, siteId),
      getLatestTlsResultsForMonitors(checkIds, siteId),
      getLatestCheckInfoForMonitors(checkIds, siteId),
      getUptimeBuckets24h(checks, siteId, timezone),
    ]);

  return checks.map((check) => {
    const rawBuckets = uptime24h.buckets.get(check.id) ?? [];
    const buckets = normalizeUptimeBuckets(rawBuckets, uptime24h.rangeStart, 24);
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
      uptimePercent: summarizeUptime(rawBuckets).percent,
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

  const [
    openIncidents,
    incidentSegments,
    lastResolvedIncidents,
    latencyStats,
    hourlyUptime,
    latencySeries,
    incidentCount,
    latestCheckInfo,
  ] = await Promise.all([
    getOpenIncidentsForMonitors([monitorId], siteId),
    getIncidentSegments24h(monitorId, siteId),
    getLastResolvedIncidentForMonitors([monitorId], siteId),
    getLatency24h(monitorId, siteId),
    getUptimeBuckets24h([monitor], siteId, timezone),
    getLatencySeries24h(monitorId, siteId),
    getIncidentCount24h(monitorId, siteId),
    getLatestCheckInfoForMonitors([monitorId], siteId).then((r) => r[monitorId] ?? null),
  ]);

  const monitorBuckets = hourlyUptime.buckets.get(monitorId) ?? [];
  const uptime24h = summarizeUptime(monitorBuckets);
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
    uptime24hPercent: uptime24h.percent,
    uptime24hHours: uptime24h.monitoredSeconds / 60 / 60,
    incidents24h: incidentCount,
    incidentSegments24h: incidentSegments,
    uptimeBuckets: normalizeUptimeBuckets(monitorBuckets, hourlyUptime.rangeStart, 24),
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

  // Day boundaries in the zone the buckets use, so the last bucket is the zone's today
  const rangeEnd = moment.tz(timezone).startOf('day').add(1, 'day');
  const rangeStart = rangeEnd.clone().subtract(days, 'days');

  const buckets = await getUptimeBuckets([toUptimeMonitorRef(monitor)], siteId, {
    rangeStart: rangeStart.toDate(),
    rangeEnd: rangeEnd.toDate(),
    granularity: 'day',
    timezone,
  });

  return (buckets.get(monitorId) ?? []).map(({ bucket, upRatio, monitoredSeconds, upSeconds }) => ({
    date: formatDayKey(new Date(bucket), timezone),
    upRatio,
    monitoredSeconds,
    upSeconds,
  }));
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

export async function getMonitorSummariesForRange(
  dashboardId: string,
  siteId: string,
  start: Date,
  end: Date,
): Promise<MonitorRangeSummary[]> {
  const checks = await listMonitorChecks(dashboardId);
  if (!checks.length) return [];

  const checkIds = checks.map((check) => check.id);
  const rangeStart = toDateTimeString(start);
  const rangeEnd = toDateTimeString(end);

  const [openIncidents, lastResolvedIncidents, latestCheckInfo, uptimeBuckets, latencyStats, tlsResults] =
    await Promise.all([
      getOpenIncidentsForMonitors(checkIds, siteId),
      getLastResolvedIncidentForMonitors(checkIds, siteId),
      getLatestCheckInfoForMonitors(checkIds, siteId),
      // Buckets are clipped to the exact range, so their sum is the range's figure
      getUptimeBuckets(checks.map(toUptimeMonitorRef), siteId, {
        rangeStart: start,
        rangeEnd: end,
        granularity: 'day',
        timezone: 'UTC',
      }),
      getLatencyStatsForMonitors(checkIds, siteId, rangeStart, rangeEnd),
      getLatestTlsResultsForMonitors(checkIds, siteId),
    ]);

  return checks.map((check) => {
    const checkInfo = latestCheckInfo[check.id];
    const openIncident = openIncidents.get(check.id);
    const operationalState = deriveOperationalState(check.isEnabled, checkInfo?.ts != null, openIncident != null);
    const uptime = summarizeUptime(uptimeBuckets.get(check.id) ?? []);

    return {
      monitor: check,
      operationalState,
      currentStateSince: deriveCurrentStateSince(operationalState, {
        openIncident,
        lastResolvedIncident: lastResolvedIncidents.get(check.id),
        createdAt: check.createdAt,
      }),
      lastCheckAt: checkInfo?.ts ?? null,
      lastStatus: checkInfo?.status ?? null,
      effectiveIntervalSeconds: checkInfo?.effectiveIntervalSeconds ?? null,
      backoffLevel: checkInfo?.backoffLevel ?? null,
      uptimePercent: uptime.percent,
      uptimeSeconds: uptime.upSeconds,
      monitoredSeconds: uptime.monitoredSeconds,
      latency: latencyStats.get(check.id) ?? { avgMs: null, minMs: null, maxMs: null },
      tls: tlsResults[check.id] ?? null,
    };
  });
}

export async function getMonitorIncidentsForRange(
  dashboardId: string,
  siteId: string,
  options: { start: Date; end: Date; monitorId?: string; state?: IncidentState; limit: number },
): Promise<MonitorIncidentWithMonitor[]> {
  const scoped = options.monitorId
    ? [await getMonitorCheckById(dashboardId, options.monitorId)].filter((check) => check != null)
    : await listMonitorChecks(dashboardId);

  if (options.monitorId && !scoped.length) {
    throw new Error('Monitor not found');
  }
  if (!scoped.length) return [];

  const monitorsById = new Map(scoped.map((check) => [check.id, check]));
  const incidents = await getMonitorIncidentsInRange(
    scoped.map((check) => check.id),
    siteId,
    toDateTimeString(options.start),
    toDateTimeString(options.end),
    options.limit,
    options.state,
  );

  return incidents.flatMap((incident) => {
    const monitor = monitorsById.get(incident.monitorCheckId);
    return monitor ? [{ ...incident, monitor }] : [];
  });
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
