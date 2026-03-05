'use server';

import { fetchVisitorsByGeoLevel } from '@/services/analytics/geography.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { CountryCodeFormat, dataToWorldMap } from '@/presenters/toWorldMap';
import type { WorldMapResponse, GeoVisitor, GeoLevel } from '@/entities/analytics/geography.entities';
import { toDataTable } from '@/presenters/toDataTable';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import { getDashboardSettings } from '@/services/dashboard/dashboardSettings.service';

async function fetchTopGeoVisits<K extends string>(
  ctx: AuthContext,
  query: BAAnalyticsQuery,
  level: GeoLevel,
  categoryKey: K,
  getKey: (row: GeoVisitor) => string | undefined,
  limit: number,
) {
  const { main, compare } = toSiteQuery(ctx.siteId, query);
  const minVisitors =
    level !== 'country_code' ? (await getDashboardSettings(ctx.dashboardId)).geoMinThreshold : 0;

  const geoVisitors = await fetchVisitorsByGeoLevel(main, level, undefined, limit, minVisitors);
  const topKeys = geoVisitors.map(getKey);

  const compareGeoVisitors =
    compare &&
    (await fetchVisitorsByGeoLevel(compare, level, undefined, 1000, minVisitors)).filter((row) =>
      topKeys.includes(getKey(row)),
    );

  return toDataTable({
    data: geoVisitors as (GeoVisitor & Record<K, string>)[],
    compare: compareGeoVisitors as (GeoVisitor & Record<K, string>)[] | null | undefined,
    categoryKey,
  });
}

export const getWorldMapDataAlpha2 = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery): Promise<WorldMapResponse> => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    try {
      const geoVisitors = await fetchVisitorsByGeoLevel(main, 'country_code');
      const compareGeoVisitors = compare && (await fetchVisitorsByGeoLevel(compare, 'country_code'));

      return dataToWorldMap(geoVisitors, compareGeoVisitors ?? [], CountryCodeFormat.Original);
    } catch (error) {
      console.error('Error fetching visitor map data:', error);
      throw new Error('Failed to fetch visitor map data');
    }
  },
);

export const getTopCountryVisitsAction = withDashboardAuthContext(
  (ctx: AuthContext, query: BAAnalyticsQuery, limit: number = 10) =>
    fetchTopGeoVisits(ctx, query, 'country_code', 'country_code', (r) => r.country_code, limit),
);

export const getTopSubdivisionVisitsAction = withDashboardAuthContext(
  (ctx: AuthContext, query: BAAnalyticsQuery, limit: number = 10) =>
    fetchTopGeoVisits(ctx, query, 'subdivision_code', 'region', (r) => r.region, limit),
);

export const getTopCityVisitsAction = withDashboardAuthContext(
  (ctx: AuthContext, query: BAAnalyticsQuery, limit: number = 10) =>
    fetchTopGeoVisits(ctx, query, 'city', 'city', (r) => r.city, limit),
);
