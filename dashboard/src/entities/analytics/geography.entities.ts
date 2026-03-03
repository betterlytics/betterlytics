import { z } from 'zod';

/** Supported geographic aggregation levels (ClickHouse column names) */
export const GEO_LEVELS = ['country_code', 'subdivision_code', 'city'] as const;
export const GeoLevelSchema = z.enum(GEO_LEVELS);
export type GeoLevel = z.infer<typeof GeoLevelSchema>;

/** Generic geographic feature visitor — `code` is the feature identifier (country code, subdivision code, etc.) */
export const GeoFeatureVisitorSchema = z.object({
  code: z.string(),
  visitors: z.preprocess((val) => Number(val), z.number()),
  countryCode: z.string().optional(),
});

export type GeoFeatureVisitor = z.infer<typeof GeoFeatureVisitorSchema>;

export type GeoFeatureVisitorWithCompare = GeoFeatureVisitor & {
  compareVisitors?: number;
};

export type GeoMapResponse = {
  visitorData: GeoFeatureVisitor[];
  compareData: GeoFeatureVisitor[];
  maxVisitors: number;
};
