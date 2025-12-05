'use server';

import { fetchVisitorsByGeography } from '@/services/analytics/geography';
import { z } from 'zod';
import { QueryFilterSchema } from '@/entities/analytics/filter';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext';
import { CountryCodeFormat, dataToWorldMap } from '@/presenters/toWorldMap';
import type { WorldMapResponse } from '@/entities/analytics/geography';
import { toDataTable } from '@/presenters/toDataTable';

const queryParamsSchema = z.object({
  siteId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  compareStartDate: z.date().optional(),
  compareEndDate: z.date().optional(),
  queryFilters: QueryFilterSchema.array(),
});

/**
 * Server action to fetch geographic visitor data for world map in Alpha-2 format
 */
export const getWorldMapDataAlpha2 = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    params: Omit<z.infer<typeof queryParamsSchema>, 'siteId'>,
  ): Promise<WorldMapResponse> => {
    const validatedParams = queryParamsSchema.safeParse({
      ...params,
      siteId: ctx.siteId,
    });

    if (!validatedParams.success) {
      throw new Error(`Invalid parameters: ${validatedParams.error.message}`);
    }

    const { startDate, endDate, queryFilters, compareStartDate, compareEndDate } = validatedParams.data;

    try {
      const geoVisitors = await fetchVisitorsByGeography(ctx.siteId, startDate, endDate, queryFilters);

      const compareGeoVisitors =
        compareStartDate &&
        compareEndDate &&
        (await fetchVisitorsByGeography(ctx.siteId, compareStartDate, compareEndDate, queryFilters));

      return dataToWorldMap(geoVisitors, compareGeoVisitors ?? [], CountryCodeFormat.Original);
    } catch (error) {
      console.error('Error fetching visitor map data:', error);
      throw new Error('Failed to fetch visitor map data');
    }
  },
);

const topCountriesQueryParamsSchema = queryParamsSchema.extend({
  numberOfCountries: z.number().optional(),
});

export const getTopCountryVisitsAction = withDashboardAuthContext(
  async (ctx: AuthContext, params: Omit<z.infer<typeof topCountriesQueryParamsSchema>, 'siteId'>) => {
    const validatedParams = topCountriesQueryParamsSchema.safeParse({
      ...params,
      siteId: ctx.siteId,
    });

    if (!validatedParams.success) {
      throw new Error(`Invalid parameters: ${validatedParams.error.message}`);
    }

    const {
      startDate,
      endDate,
      queryFilters,
      compareStartDate,
      compareEndDate,
      numberOfCountries = 10,
    } = validatedParams.data;

    try {
      const geoVisitors = (await fetchVisitorsByGeography(ctx.siteId, startDate, endDate, queryFilters)).slice(
        0,
        numberOfCountries,
      );

      const topCountries = geoVisitors.map((row) => row.country_code);

      const compareGeoVisitors =
        compareStartDate &&
        compareEndDate &&
        (await fetchVisitorsByGeography(ctx.siteId, compareStartDate, compareEndDate, queryFilters)).filter(
          (row) => topCountries.includes(row.country_code),
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
