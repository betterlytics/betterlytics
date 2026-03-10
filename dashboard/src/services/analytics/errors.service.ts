'server-only';

import { hasAnyErrors, getErrorGroup, getErrorGroups, getErrorVolume, getErrorGroupVolumes, getGlobalErrorGroupFirstSeen, getErrorGroupBrowserBreakdown, getErrorGroupDeviceTypeBreakdown, getErrorGroupDailyVolume, getErrorOccurrence } from '@/repositories/clickhouse/errors.repository';
import { ErrorGroupRow, ErrorGroupVolumeRow, ErrorVolumeRow, ErrorGroupEnvironmentRow, ErrorGroupVolumePoint, ErrorOccurrence, StackFrame, type ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';
import { parseStackTrace } from '@/utils/parseStackTrace';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { getTrackedErrorGroups, upsertErrorGroup, bulkUpsertErrorGroup } from '@/repositories/postgres/errorGroup.repository';

export async function getErrorGroupForSite(
  siteId: string,
  dashboardId: string,
  fingerprint: string,
): Promise<ErrorGroupRow | null> {
  const row = await getErrorGroup(siteId, fingerprint);
  if (!row) return null;

  const statusMap = await getTrackedErrorGroups(dashboardId, [fingerprint]);
  return { ...row, status: statusMap[fingerprint] ?? 'unresolved' };
}

export type ErrorGroupSidebarData = {
  browsers: ErrorGroupEnvironmentRow[];
  deviceTypes: ErrorGroupEnvironmentRow[];
  dailyVolume: ErrorGroupVolumePoint[];
};

export async function getErrorGroupSidebarDataForSite(
  siteId: string,
  fingerprint: string,
): Promise<ErrorGroupSidebarData> {
  const [browsers, deviceTypes, dailyVolume] = await Promise.all([
    getErrorGroupBrowserBreakdown(siteId, fingerprint),
    getErrorGroupDeviceTypeBreakdown(siteId, fingerprint),
    getErrorGroupDailyVolume(siteId, fingerprint),
  ]);
  return { browsers, deviceTypes, dailyVolume };
}

export async function getErrorOccurrenceForSite(
  siteId: string,
  fingerprint: string,
  offset: number,
): Promise<ErrorOccurrence | null> {
  const raw = await getErrorOccurrence(siteId, fingerprint, offset);
  if (!raw) return null;

  let mechanism = '';
  let frames: StackFrame[] = [];
  try {
    const exceptions = JSON.parse(raw.exception_list);
    const ex = exceptions?.[0];
    mechanism = ex?.mechanism ?? '';
    frames = ex?.stack ? parseStackTrace(ex.stack) : [];
  } catch {
    // If we encounter a malformed exception_list we leave frames empty
  }

  return {
    timestamp: raw.timestamp,
    url: raw.url,
    browser: raw.browser,
    os: raw.os,
    device_type: raw.device_type,
    country_code: raw.country_code,
    session_id: raw.session_id,
    error_type: raw.error_type,
    error_message: raw.error_message,
    mechanism,
    frames,
  };
}

export async function hasAnyErrorsForSite(siteId: string): Promise<boolean> {
  return hasAnyErrors(siteId);
}

export async function getErrorGroupsForSite(
  siteQuery: BASiteQuery,
  dashboardId: string,
): Promise<ErrorGroupRow[]> {
  const rows = await getErrorGroups(siteQuery);
  if (rows.length === 0) return rows;

  const fingerprints = rows.map((r) => r.error_fingerprint);
  const statusMap = await getTrackedErrorGroups(dashboardId, fingerprints);

  return rows.map((r) => ({
    ...r,
    status: statusMap[r.error_fingerprint] ?? 'unresolved',
  }));
}

export async function upsertErrorGroupForSite(
  dashboardId: string,
  errorFingerprint: string,
  status: ErrorGroupStatusValue,
): Promise<void> {
  return upsertErrorGroup(dashboardId, errorFingerprint, status);
}

export async function bulkUpsertErrorGroupForSite(
  dashboardId: string,
  fingerprints: string[],
  status: ErrorGroupStatusValue,
): Promise<void> {
  return bulkUpsertErrorGroup(dashboardId, fingerprints, status);
}

export async function getGlobalErrorGroupFirstSeenForSite(siteId: string): Promise<Record<string, Date>> {
  return getGlobalErrorGroupFirstSeen(siteId);
}

export async function getErrorVolumeForSite(siteQuery: BASiteQuery): Promise<ErrorVolumeRow[]> {
  return getErrorVolume(siteQuery);
}

export async function getErrorGroupVolumesForSite(
  siteQuery: BASiteQuery,
  fingerprints: string[],
): Promise<ErrorGroupVolumeRow[]> {
  return getErrorGroupVolumes(siteQuery, fingerprints);
}
