'server-only';

import { hasAnyErrors, getErrorGroup, getErrorGroups, getErrorVolume, getErrorGroupVolumes, getGlobalErrorGroupFirstSeen } from '@/repositories/clickhouse/errors.repository';
import { ErrorGroupRow, ErrorGroupVolumeRow, ErrorVolumeRow, type ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';
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
