'server-only';

import {
  getVisitorsByCountry,
  getVisitorsBySubdivision,
  getVisitorsByCity,
  getCompareVisitorsByCountry,
  getCompareVisitorsBySubdivision,
  getCompareVisitorsByCity,
} from '@/repositories/clickhouse/geography.repository';
import { GeoVisitor, GeoLevel } from '@/entities/analytics/geography.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function fetchVisitorsByGeoLevel(
  siteQuery: BASiteQuery,
  level: GeoLevel,
  limit: number = 1000,
): Promise<GeoVisitor[]> {
  switch (level) {
    case 'country_code':
      return getVisitorsByCountry(siteQuery, limit);
    case 'subdivision_code':
      return getVisitorsBySubdivision(siteQuery, limit);
    case 'city':
      return getVisitorsByCity(siteQuery, limit);
  }
}

export async function fetchCompareVisitorsByGeoLevel(
  siteQuery: BASiteQuery,
  level: GeoLevel,
  keys: string[] | [string, string][],
): Promise<GeoVisitor[]> {
  switch (level) {
    case 'country_code':
      return getCompareVisitorsByCountry(siteQuery, keys as string[]);
    case 'subdivision_code':
      return getCompareVisitorsBySubdivision(siteQuery, keys as [string, string][]);
    case 'city':
      return getCompareVisitorsByCity(siteQuery, keys as [string, string][]);
  }
}
