import { z } from 'zod';

export const GeoVisitorSchema = z.object({
  country_code: z.string(),
  visitors: z.preprocess((val) => Number(val), z.number()),
});

export const worldMapResponseSchema = z.object({
  visitorData: z.array(GeoVisitorSchema),
  maxVisitors: z.number(),
});

export const GeoVisitorTimeseriesSchema = z.object({
  country_code: z.string(),
  visitors: z.preprocess((val) => Number(val), z.number()),
});

export const worldMapTimeseriesReponseSchema = worldMapResponseSchema.extend({
  timestamp: z.number(),
});

export type GeoVisitor = z.infer<typeof GeoVisitorSchema>;
export type WorldMapResponse = z.infer<typeof worldMapResponseSchema>;
export type WorldMapResponseTimeseries = z.infer<typeof worldMapTimeseriesReponseSchema>;
