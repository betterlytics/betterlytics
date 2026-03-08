'use server';

import { fetchVisitorsByGeoLevel } from '@/services/analytics/geography.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { CountryCodeFormat, dataToWorldMap } from '@/presenters/toWorldMap';
import type { WorldMapResponse, GeoVisitor, GeoLevel } from '@/entities/analytics/geography.entities';
import { getAllowedGeoLevels } from '@/entities/analytics/geography.entities';
import type { GeoLevelSetting } from '@/entities/dashboard/dashboardSettings.entities';
import { toDataTable } from '@/presenters/toDataTable';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import { getDashboardSettings } from '@/services/dashboard/dashboardSettings.service';

async function fetchTopGeoVisits(
  ctx: AuthContext,
  query: BAAnalyticsQuery,
  level: GeoLevel,
  limit: number,
) {
  const settings = await getDashboardSettings(ctx.dashboardId);
  const allowedLevels = getAllowedGeoLevels(settings.geoLevel as GeoLevelSetting);

  if (!allowedLevels.includes(level)) {
    return [];
  }

  const { main, compare } = toSiteQuery(ctx.siteId, query);
  const minVisitors = level !== 'country_code' ? settings.geoMinThreshold : 0;

  const geoVisitors = await fetchVisitorsByGeoLevel(main, level, limit, minVisitors);
  const topKeys = geoVisitors.map((r) => r[level]);

  const compareGeoVisitors =
    compare &&
    (await fetchVisitorsByGeoLevel(compare, level, 1000, minVisitors)).filter((row) =>
      topKeys.includes(row[level]),
    );

  return toDataTable({
    data: geoVisitors as (GeoVisitor & Record<GeoLevel, string>)[],
    compare: compareGeoVisitors as (GeoVisitor & Record<GeoLevel, string>)[] | null | undefined,
    categoryKey: level,
  });
}

export const getWorldMapDataAlpha2 = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery): Promise<WorldMapResponse> => {
    const settings = await getDashboardSettings(ctx.dashboardId);
    const allowedLevels = getAllowedGeoLevels(settings.geoLevel as GeoLevelSetting);

    if (!allowedLevels.includes('country_code')) {
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
    fetchTopGeoVisits(ctx, query, level, limit),
);
