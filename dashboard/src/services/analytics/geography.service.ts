'server-only';

import { getVisitorsByGeoLevel } from '@/repositories/clickhouse/geography.repository';
import { GeoVisitor, GeoLevel } from '@/entities/analytics/geography.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

/**
 * Fetches visitor data aggregated by a geographic level from the database
 * @param level The geographic column to group by (e.g. 'country_code', 'subdivision_code')
 * @param parentFilter Optional parent-level filter (e.g. { column: 'country_code', value: 'US' })
 * @param limit Defaults to 1000
 */
export async function fetchVisitorsByGeoLevel(
  siteQuery: BASiteQuery,
  level: GeoLevel,
  parentFilter?: { column: GeoLevel; value: string },
  limit: number = 1000,
  minVisitors: number = 0,
): Promise<GeoVisitor[]> {
  return getVisitorsByGeoLevel(siteQuery, level, parentFilter, limit, minVisitors);
}
