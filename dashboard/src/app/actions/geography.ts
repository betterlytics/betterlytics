'use server';

import { fetchVisitorsByGeography } from '@/services/geography';
import { z } from 'zod';
import { QueryFilterSchema } from '@/entities/filter';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { CountryCodeFormat, dataToWorldMap } from '@/presenters/toWorldMap';
import { worldMapResponseSchema } from '@/entities/geography';
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
  async (ctx: AuthContext, params: Omit<z.infer<typeof queryParamsSchema>, 'siteId'>) => {
    const validatedParams = queryParamsSchema.safeParse({
      ...params,
      siteId: ctx.siteId,
    });

    if (!validatedParams.success) {
      throw new Error(`Invalid parameters: ${validatedParams.error.message}`);
    }

    const { startDate, endDate, queryFilters, compareStartDate, compareEndDate } = validatedParams.data;

    try {
      const geoVisitors = worldMapResponseSchema.parse(
        dataToWorldMap(
          await fetchVisitorsByGeography(ctx.siteId, startDate, endDate, queryFilters),
          CountryCodeFormat.Original,
        ),
      );
      const compareGeoVisitors =
        compareStartDate &&
        compareEndDate &&
        worldMapResponseSchema.parse(
          dataToWorldMap(
            await fetchVisitorsByGeography(ctx.siteId, compareStartDate, compareEndDate, queryFilters),
            CountryCodeFormat.Original,
          ),
        );
      return {
        visitorData: toDataTable({
          data: geoVisitors.visitorData,
          compare: compareGeoVisitors?.visitorData,
          categoryKey: 'country_code',
        }),
        maxVisitors: geoVisitors.maxVisitors,
      };
    } catch (error) {
      console.error('Error fetching visitor map data:', error);
      throw new Error('Failed to fetch visitor map data');
    }
  },
);
