'use server';

import { fetchVisitorsByGeoLevel, fetchCompareVisitorsByGeoLevel } from '@/services/analytics/geography.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { CountryCodeFormat, dataToWorldMap } from '@/presenters/toWorldMap';
import { GeoLevelSchema, type WorldMapResponse, type GeoVisitor, type GeoLevel } from '@/entities/analytics/geography.entities';
import { getEnabledGeoLevels } from '@/lib/geoLevels';
import { toDataTable } from '@/presenters/toDataTable';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

async function fetchTopGeoVisits(
  ctx: AuthContext,
  query: BAAnalyticsQuery,
  level: GeoLevel,
  limit: number,
) {
  const enabledLevels = getEnabledGeoLevels();

  if (!enabledLevels.includes(level)) {
    return [];
  }

  const { main, compare } = toSiteQuery(ctx.siteId, query);

  const geoVisitors = await fetchVisitorsByGeoLevel(main, level, limit);
  const topKeys = geoVisitors.map((r) => r[level]).filter(Boolean) as string[];

  const compareGeoVisitors =
    compare && topKeys.length > 0
      ? await fetchCompareVisitorsByGeoLevel(compare, level, topKeys)
      : undefined;

  return toDataTable({
    data: geoVisitors as (GeoVisitor & Record<GeoLevel, string>)[],
    compare: compareGeoVisitors as (GeoVisitor & Record<GeoLevel, string>)[] | null | undefined,
    categoryKey: level,
  });
}

export const getWorldMapDataAlpha2 = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery): Promise<WorldMapResponse> => {
    const enabledLevels = getEnabledGeoLevels();

    if (!enabledLevels.includes('country_code')) {
      return { visitorData: [], compareData: [], maxVisitors: 0 };
    }

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

export const getTopGeoVisitsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, level: GeoLevel, limit: number = 10) =>
    fetchTopGeoVisits(ctx, query, GeoLevelSchema.parse(level), limit),
);
