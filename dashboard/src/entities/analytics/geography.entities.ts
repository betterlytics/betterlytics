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

export type GeoFeatureVisitor = {
  code: string;
  visitors: number;
};

export type GeoMapResponse = {
  visitorData: GeoFeatureVisitor[];
  compareData: GeoFeatureVisitor[];
  maxVisitors: number;
};

export type GeoFeatureVisitorWithCompare = GeoFeatureVisitor & {
  compareVisitors?: number;
};
