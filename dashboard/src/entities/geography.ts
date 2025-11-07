import { z } from 'zod';

export const GeoVisitorSchema = z.object({
  country_code: z.string(),
  visitors: z.preprocess((val) => Number(val), z.number()),
});

export const worldMapResponseSchema = z.object({
  visitorData: z.array(GeoVisitorSchema),
  compareData: z.array(GeoVisitorSchema),
  maxVisitors: z.number(),
});

export type GeoVisitor = z.infer<typeof GeoVisitorSchema>;
export type WorldMapResponse = z.infer<typeof worldMapResponseSchema>;

export type GeoVisitorComparison = {
  compareVisitors?: number;
  compareDate?: Date;
  dAbs?: number; // visitors - compareVisitors
  dProcent?: number; // (dAbs / compareVisitors) * 100
};

export type GeoVisitorWithCompare = GeoVisitor & {
  compare: GeoVisitorComparison;
  date?: Date;
};
