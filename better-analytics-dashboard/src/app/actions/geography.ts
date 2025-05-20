'use server';

import { fetchVisitorsByGeography } from '@/services/geography';
import { z } from 'zod';
import { GeoVisitorSchema } from '@/entities/geography';

// Schema for validating the input parameters
const queryParamsSchema = z.object({
  siteId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
});

const worldMapResponseSchema = z.object({
  visitorData: z.array(GeoVisitorSchema),
  maxVisitors: z.number(),
});

/**
 * Server action to fetch geographic visitor data
 */
export async function getWorldMapData(
  params: z.infer<typeof queryParamsSchema>
): Promise<z.infer<typeof worldMapResponseSchema>> {
  const validatedParams = queryParamsSchema.safeParse(params);
  
  if (!validatedParams.success) {
    throw new Error(`Invalid parameters: ${validatedParams.error.message}`);
  }
  
  const { siteId, startDate, endDate } = validatedParams.data;
  
  try {
    const geoVisitors = await fetchVisitorsByGeography(siteId, startDate, endDate);
    
    const maxVisitors = Math.max(...geoVisitors.map(d => d.visitors), 1);
    
    return worldMapResponseSchema.parse({
      visitorData: geoVisitors,
      maxVisitors
    });
  } catch (error) {
    console.error('Error fetching visitor map data:', error);
    throw new Error('Failed to fetch visitor map data');
  }
} 