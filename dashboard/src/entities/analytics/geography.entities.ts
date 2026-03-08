import { z } from 'zod';
import type { GeoLevelSetting } from '@/entities/dashboard/dashboardSettings.entities';

/** Supported geographic aggregation levels (ClickHouse column names) */
export const GEO_LEVELS = ['country_code', 'subdivision_code', 'city'] as const;
export const GeoLevelSchema = z.enum(GEO_LEVELS);
export type GeoLevel = z.infer<typeof GeoLevelSchema>;

export const GeoVisitorSchema = z.object({
  country_code: z.string(),
  visitors: z.preprocess((val) => Number(val), z.number()),
  subdivision_code: z.string().optional(),
  city: z.string().optional(),
});

export const worldMapResponseSchema = z.object({
  visitorData: z.array(GeoVisitorSchema),
  compareData: z.array(GeoVisitorSchema),
  maxVisitors: z.number(),
});

export type GeoVisitor = z.infer<typeof GeoVisitorSchema>;
export type WorldMapResponse = z.infer<typeof worldMapResponseSchema>;

export type GeoVisitorWithCompare = GeoVisitor & {
  compareVisitors?: number;
};

/** Maps a dashboard geoLevel setting to the ClickHouse geo levels it permits */
export function getAllowedGeoLevels(geoLevel: GeoLevelSetting): GeoLevel[] {
  switch (geoLevel) {
    case 'OFF': return [];
    case 'COUNTRY': return ['country_code'];
    case 'REGION': return ['country_code', 'subdivision_code'];
    case 'CITY': return ['country_code', 'subdivision_code', 'city'];
  }
}
