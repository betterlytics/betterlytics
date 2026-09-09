import { z } from 'zod';

export const GEO_LEVELS = ['country_code', 'subdivision_code', 'city'] as const;
export const GeoLevelSchema = z.enum(GEO_LEVELS);
export type GeoLevel = z.infer<typeof GeoLevelSchema>;

export const GeoVisitorSchema = z.object({
  country_code: z.string(),
  visitors: z.preprocess((val) => Number(val), z.number()),
  subdivision_code: z.string().optional(),
  city: z.string().optional(),
});

export type GeoVisitor = z.infer<typeof GeoVisitorSchema>;

export const GeoFeatureVisitorSchema = z.object({
  code: z.string(),
  visitors: z.preprocess((val) => Number(val), z.number()),
});
export type GeoFeatureVisitor = z.infer<typeof GeoFeatureVisitorSchema>;

export const geoMapResponseSchema = z.object({
  visitorData: z.array(GeoFeatureVisitorSchema),
  compareData: z.array(GeoFeatureVisitorSchema),
  maxVisitors: z.number(),
});
export type GeoMapResponse = z.infer<typeof geoMapResponseSchema>;

export type GeoFeatureVisitorWithCompare = GeoFeatureVisitor & {
  compareVisitors?: number;
};

