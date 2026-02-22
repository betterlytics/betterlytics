import { z } from 'zod';

export const GeoVisitorSchema = z.object({
  country_code: z.string(),
  visitors: z.coerce.number(),
});

export const worldMapResponseSchema = z.object({
  visitorData: z.array(GeoVisitorSchema),
  compareData: z.array(GeoVisitorSchema),
  maxVisitors: z.coerce.number(),
});

export type GeoVisitor = z.infer<typeof GeoVisitorSchema>;
export type WorldMapResponse = z.infer<typeof worldMapResponseSchema>;

export type GeoVisitorWithCompare = GeoVisitor & {
  compareVisitors?: number;
};
