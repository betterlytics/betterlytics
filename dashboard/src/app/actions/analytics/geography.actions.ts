'use server';

import { fetchVisitorsByGeography } from '@/services/analytics/geography.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { CountryCodeFormat, dataToWorldMap } from '@/presenters/toWorldMap';
import type { WorldMapResponse } from '@/entities/analytics/geography.entities';
import { toDataTable } from '@/presenters/toDataTable';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export const getWorldMapDataAlpha2 = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery): Promise<WorldMapResponse> => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    try {
      const geoVisitors = await fetchVisitorsByGeography(main);
      const compareGeoVisitors = compare && (await fetchVisitorsByGeography(compare));

      return dataToWorldMap(geoVisitors, compareGeoVisitors ?? [], CountryCodeFormat.Original);
    } catch (error) {
      console.error('Error fetching visitor map data:', error);
      throw new Error('Failed to fetch visitor map data');
    }
  },
);

export const getTopCountryVisitsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, numberOfCountries: number = 10) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    try {
      const geoVisitors = (await fetchVisitorsByGeography(main)).slice(0, numberOfCountries);
      const topCountries = geoVisitors.map((row) => row.country_code);

      const compareGeoVisitors =
        compare &&
        (await fetchVisitorsByGeography(compare)).filter((row) => topCountries.includes(row.country_code));

      return toDataTable({
        data: geoVisitors,
        compare: compareGeoVisitors,
        categoryKey: 'country_code',
      });
    } catch (error) {
      console.error('Error fetching visitor map data:', error);
      throw new Error('Failed to fetch visitor map data');
    }
  },
);
