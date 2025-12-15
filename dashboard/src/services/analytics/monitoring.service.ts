'server-only';

import { MonitorCheckCreate, MonitorCheckUpdate } from '@/entities/analytics/monitoring.entities';
import {
  createMonitorCheck,
  getMonitorCheckById,
  listMonitorChecks,
  updateMonitorCheck as updateMonitorCheckRepo,
} from '@/repositories/postgres/monitoring.repository';

import {
  getLatestStatusesForMonitors,
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
  const [latestStatuses, uptimeBuckets, tlsResults] = await Promise.all([
    getLatestStatusesForMonitors(checkIds, siteId),
    getMonitorUptimeBucketsForMonitors(checkIds, siteId),
    getLatestTlsResultsForMonitors(checkIds, siteId),
  ]);

  return checks.map((check) => ({
    ...check,
    lastStatus: latestStatuses[check.id]?.status ?? null,
    effectiveIntervalSeconds: latestStatuses[check.id]?.effectiveIntervalSeconds ?? null,
    backoffLevel: latestStatuses[check.id]?.backoffLevel ?? null,
    uptimeBuckets: normalizeUptimeBuckets(uptimeBuckets[check.id] ?? [], 24, now),
    tls: tlsResults[check.id] ?? null,
  }));
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
