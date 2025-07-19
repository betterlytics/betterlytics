'use server';

import { fetchVisitorsByGeography } from '@/services/geography';
import { z } from 'zod';
import { QueryFilterSchema } from '@/entities/filter';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { CountryCodeFormat, dataToWorldMap } from '@/presenters/toWorldMap';
import { worldMapResponseSchema } from '@/entities/geography';

const queryParamsSchema = z.object({
  siteId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  queryFilters: QueryFilterSchema.array(),
});

/**
 * Server action to fetch geographic visitor data for world map in Alpha-3 format
 */
export const getWorldMapDataAlpha3 = withDashboardAuthContext(
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
      return worldMapResponseSchema.parse(dataToWorldMap(geoVisitors, CountryCodeFormat.ToAlpha3));
    } catch (error) {
      console.error('Error fetching visitor map data:', error);
      throw new Error('Failed to fetch visitor map data');
    }
  },
);
