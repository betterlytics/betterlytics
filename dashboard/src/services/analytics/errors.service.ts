'server-only';

import { getErrorGroups, getErrorVolume, getErrorGroupVolumes } from '@/repositories/clickhouse/errors.repository';
import { ErrorGroupRow, ErrorGroupVolumeRow, ErrorVolumeRow } from '@/entities/analytics/errors.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getErrorGroupsForSite(siteQuery: BASiteQuery): Promise<ErrorGroupRow[]> {
  return getErrorGroups(siteQuery);
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
