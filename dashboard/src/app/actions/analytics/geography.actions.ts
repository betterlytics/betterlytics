'use server';

import { fetchVisitorsByGeoLevel } from '@/services/analytics/geography.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { CountryCodeFormat, dataToWorldMap } from '@/presenters/toWorldMap';
import type { WorldMapResponse, GeoVisitor } from '@/entities/analytics/geography.entities';
import { toDataTable } from '@/presenters/toDataTable';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import { getDashboardSettings } from '@/services/dashboard/dashboardSettings.service';

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
  async (ctx: AuthContext, query: BAAnalyticsQuery, numberOfCountries: number = 10) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    try {
      const geoVisitors = await fetchVisitorsByGeoLevel(main, 'country_code', undefined, numberOfCountries);
      const topCountries = geoVisitors.map((row) => row.country_code);

      const compareGeoVisitors =
        compare &&
        (await fetchVisitorsByGeoLevel(compare, 'country_code')).filter((row) =>
          topCountries.includes(row.country_code),
        );

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

export const getTopSubdivisionVisitsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, numberOfSubdivisions: number = 10) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);
    const settings = await getDashboardSettings(ctx.dashboardId);
    const minVisitors = settings.geoMinThreshold;

    const geoVisitors = await fetchVisitorsByGeoLevel(
      main,
      'subdivision_code',
      undefined,
      numberOfSubdivisions,
      minVisitors,
    );
    const topSubdivisions = geoVisitors.map((row) => row.region);

    const compareGeoVisitors =
      compare &&
      (await fetchVisitorsByGeoLevel(compare, 'subdivision_code', undefined, 1000, minVisitors)).filter((row) =>
        topSubdivisions.includes(row.region),
      );

    const withRegion = geoVisitors.filter((v): v is GeoVisitor & { region: string } => v.region != null);
    const compareWithRegion = compareGeoVisitors
      ? compareGeoVisitors.filter((v): v is GeoVisitor & { region: string } => v.region != null)
      : undefined;

    return toDataTable({
      data: withRegion,
      compare: compareWithRegion,
      categoryKey: 'region',
    });
  },
);

export const getTopCityVisitsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, numberOfCities: number = 10) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);
    const settings = await getDashboardSettings(ctx.dashboardId);
    const minVisitors = settings.geoMinThreshold;

    const geoVisitors = await fetchVisitorsByGeoLevel(main, 'city', undefined, numberOfCities, minVisitors);
    const topCities = geoVisitors.map((row) => row.city);

    const compareGeoVisitors =
      compare &&
      (await fetchVisitorsByGeoLevel(compare, 'city', undefined, 1000, minVisitors)).filter((row) =>
        topCities.includes(row.city),
      );

    const withCity = geoVisitors.filter((v): v is GeoVisitor & { city: string } => v.city != null);
    const compareWithCity = compareGeoVisitors
      ? compareGeoVisitors.filter((v): v is GeoVisitor & { city: string } => v.city != null)
      : undefined;

    return toDataTable({
      data: withCity,
      compare: compareWithCity,
      categoryKey: 'city',
    });
  },
);
