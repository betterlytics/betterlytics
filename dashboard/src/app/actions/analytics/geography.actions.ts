'use server';

import { fetchVisitorsByGeoLevel } from '@/services/analytics/geography.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { CountryCodeFormat, dataToWorldMap } from '@/presenters/toWorldMap';
import type { GeoMapResponse } from '@/entities/analytics/geography.entities';
import { toDataTable } from '@/presenters/toDataTable';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import { getDashboardSettings } from '@/services/dashboard/dashboardSettings.service';

export const getWorldMapDataAlpha2 = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery): Promise<GeoMapResponse> => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const geoVisitors = await fetchVisitorsByGeoLevel(main, 'country_code');
    const compareGeoVisitors = compare && (await fetchVisitorsByGeoLevel(compare, 'country_code'));

    return dataToWorldMap(geoVisitors, compareGeoVisitors ?? [], CountryCodeFormat.Original);
  },
);

export const getTopCountryVisitsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, numberOfCountries: number = 10) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const geoVisitors = await fetchVisitorsByGeoLevel(main, 'country_code', undefined, numberOfCountries);
    const topCountries = geoVisitors.map((row) => row.code);

    const compareGeoVisitors =
      compare &&
      (await fetchVisitorsByGeoLevel(compare, 'country_code')).filter((row) => topCountries.includes(row.code));

    return toDataTable({
      data: geoVisitors,
      compare: compareGeoVisitors,
      categoryKey: 'code',
    });
  },
);

export const getTopCityVisitsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, numberOfCities: number = 10) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);
    const settings = await getDashboardSettings(ctx.dashboardId);
    const minVisitors = settings.geoMinThreshold;

    const geoVisitors = await fetchVisitorsByGeoLevel(main, 'city', undefined, numberOfCities, minVisitors);
    const topCities = geoVisitors.map((row) => row.code);

    const compareGeoVisitors =
      compare &&
      (await fetchVisitorsByGeoLevel(compare, 'city', undefined, 1000, minVisitors)).filter((row) =>
        topCities.includes(row.code),
      );

    return toDataTable({
      data: geoVisitors,
      compare: compareGeoVisitors,
      categoryKey: 'code',
    });
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
    const topSubdivisions = geoVisitors.map((row) => row.code);

    const compareGeoVisitors =
      compare &&
      (await fetchVisitorsByGeoLevel(compare, 'subdivision_code', undefined, 1000, minVisitors)).filter((row) =>
        topSubdivisions.includes(row.code),
      );

    return toDataTable({
      data: geoVisitors,
      compare: compareGeoVisitors,
      categoryKey: 'code',
    });
  },
);

