'server-only';

import { getVisitorsByCountry } from '@/repositories/clickhouse/geography.repository';
import { GeoVisitor } from '@/entities/analytics/geography.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function fetchVisitorsByGeography(siteQuery: BASiteQuery, limit: number = 1000): Promise<GeoVisitor[]> {
  return getVisitorsByCountry(siteQuery, limit);
}
