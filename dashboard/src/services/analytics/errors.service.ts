'server-only';

import { getErrorGroups, getErrorGroupCount, getErrorVolume, getErrorGroupVolumesPaginated } from '@/repositories/clickhouse/errors.repository';
import { ErrorGroupRow, ErrorGroupVolumeRow, ErrorVolumeRow } from '@/entities/analytics/errors.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getErrorGroupCountForSite(siteQuery: BASiteQuery): Promise<number> {
  return getErrorGroupCount(siteQuery);
}

export async function getErrorGroupsForSite(siteQuery: BASiteQuery, limit: number, offset: number): Promise<ErrorGroupRow[]> {
  return getErrorGroups(siteQuery, limit, offset);
}

export async function getErrorVolumeForSite(siteQuery: BASiteQuery): Promise<ErrorVolumeRow[]> {
  return getErrorVolume(siteQuery);
}

export async function getErrorGroupVolumesPaginatedForSite(siteQuery: BASiteQuery, limit: number, offset: number): Promise<ErrorGroupVolumeRow[]> {
  return getErrorGroupVolumesPaginated(siteQuery, limit, offset);
}
