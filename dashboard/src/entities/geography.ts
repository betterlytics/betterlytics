import { z } from 'zod';

export const GeoVisitorSchema = z.object({
  country_code: z.string(),
  visitors: z.preprocess((val) => Number(val), z.number()),
});

export const worldMapResponseSchema = z.object({
  visitorData: z.array(GeoVisitorSchema),
  compare: z.array(GeoVisitorSchema),
  maxVisitors: z.number(),
});

export const GeoVisitorTimeseriesSchema = z.object({
  country_code: z.string(),
  visitors: z.preprocess((val) => Number(val), z.number()),
});

export const TimeGeoVisitorsSchema = z.object({
  visitors: z.array(GeoVisitorSchema),
  date: z.date(),
});

export const TotalDataSchema = z.object({
  timeVisitors: z.array(
    z.object({
      date: z.date(),
      visitors: z.number(),
    }),
  ),
  accTotal: z.number(),
});

export const GeoTimeseriesResponseSchema = z.object({
  timeseries: z.array(TimeGeoVisitorsSchema),
  accumulated: TimeGeoVisitorsSchema,
  totalData: TotalDataSchema,
  compare: z
    .object({
      timeseries: z.array(TimeGeoVisitorsSchema),
      accumulated: TimeGeoVisitorsSchema,
    })
    .optional(),
  maxVisitorsTimeseries: z.number(),
  maxVisitorsAccumulated: z.number(),
});

export type GeoVisitor = z.infer<typeof GeoVisitorSchema>;
export type TimeGeoVisitors = z.infer<typeof TimeGeoVisitorsSchema>;
export type TotalData = z.infer<typeof TotalDataSchema>;
export type GeoTimeseriesResponse = z.infer<typeof GeoTimeseriesResponseSchema>;

export type WorldMapResponse = z.infer<typeof worldMapResponseSchema>;
