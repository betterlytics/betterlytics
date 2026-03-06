'server-only';

import { hasAnyErrors, getErrorGroups, getErrorVolume, getErrorGroupVolumes, getGlobalErrorGroupFirstSeen } from '@/repositories/clickhouse/errors.repository';
import { ErrorGroupRow, ErrorGroupVolumeRow, ErrorVolumeRow } from '@/entities/analytics/errors.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function hasAnyErrorsForSite(siteId: string): Promise<boolean> {
  return hasAnyErrors(siteId);
}

export async function getErrorGroupsForSite(siteQuery: BASiteQuery): Promise<ErrorGroupRow[]> {
  return getErrorGroups(siteQuery);
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
