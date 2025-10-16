'use server';

import { fetchVisitorsByGeography, fetchVisitorsByGeographyTimeseries } from '@/services/geography';
import { z } from 'zod';
import { QueryFilterSchema } from '@/entities/filter';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { CountryCodeFormat, dataToWorldMap } from '@/presenters/toWorldMap';
import { worldMapResponseSchema } from '@/entities/geography';
import { toDataTable } from '@/presenters/toDataTable';
import type { GranularityRangeValues } from '@/utils/granularityRanges';
import { toStackedAreaChart } from '@/presenters/toStackedAreaChart';

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
  ): Promise<z.infer<typeof worldMapResponseSchema>> => {
    const validatedParams = queryParamsSchema.safeParse({
      ...params,
      siteId: ctx.siteId,
    });

    if (!validatedParams.success) {
      throw new Error(`Invalid parameters: ${validatedParams.error.message}`);
    }

    const { startDate, endDate, queryFilters } = validatedParams.data;

    try {
      const geoVisitors = await fetchVisitorsByGeography(ctx.siteId, startDate, endDate, queryFilters);
      return worldMapResponseSchema.parse(dataToWorldMap(geoVisitors, CountryCodeFormat.Original));
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

/**
 * Server action to timeseries of worldmap data based on granularity
 */
export const getWorldMapGranularityTimeseries = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    params: Omit<z.infer<typeof queryParamsSchema>, 'siteId'>,
    granularity: GranularityRangeValues,
  ) => {
    const validatedParams = queryParamsSchema.safeParse({
      ...params,
      siteId: ctx.siteId,
    });

    if (!validatedParams.success) {
      throw new Error(`Invalid parameters: ${validatedParams.error.message}`);
    }

    const { startDate, endDate, queryFilters } = validatedParams.data;

    try {
      const geoVisitors = await fetchVisitorsByGeographyTimeseries(
        ctx.siteId,
        startDate,
        endDate,
        queryFilters,
        granularity,
      );

      //! TODO: include dataToWorldmap
      // return worldMapResponseSchema.parse(dataToWorldMap(geoVisitors, CountryCodeFormat.Original));

      return toStackedAreaChart({
        data: geoVisitors,
        categoryKey: 'country_code',
        valueKey: 'visitors',
        granularity,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      });
    } catch (error) {
      console.error('Error fetching visitor map data:', error);
      throw new Error('Failed to fetch visitor map data');
    }
  },
);
