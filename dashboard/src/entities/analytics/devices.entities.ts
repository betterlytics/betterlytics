import { z } from 'zod';

const rollupToBoolean = (val: unknown): boolean => {
  const num = Number(val);
  return num === 1;
};

export const DeviceTypeSchema = z.object({
  device_type: z.string(),
  visitors: z.coerce.number(),
});

export const BrowserInfoSchema = z.object({
  browser: z.string(),
  visitors: z.coerce.number(),
});

export const OperatingSystemInfoSchema = z.object({
  os: z.string(),
  visitors: z.coerce.number(),
});

export const BrowserStatsSchema = z.object({
  browser: z.string(),
  visitors: z.coerce.number(),
  percentage: z.coerce.number(),
});

export const OperatingSystemStatsSchema = z.object({
  os: z.string(),
  visitors: z.coerce.number(),
  percentage: z.coerce.number(),
});

export const DeviceUsageTrendRowSchema = z.object({
  date: z.string(),
  device_type: z.string(),
  count: z.coerce.number(),
});

export const BrowserRollupRowSchema = z.object({
  browser: z.string(),
  version: z.string().nullable(),
  visitors: z.coerce.number(),
  is_rollup: z.preprocess(rollupToBoolean, z.boolean()),
});
export const OperatingSystemRollupRowSchema = z.object({
  os: z.string(),
  version: z.string().nullable(),
  visitors: z.coerce.number(),
  is_rollup: z.preprocess(rollupToBoolean, z.boolean()),
});

export const DeviceBreakdownCombinedSchema = z.object({
  devices: z.array(DeviceTypeSchema),
  browsersRollup: z.array(BrowserRollupRowSchema),
  operatingSystemsRollup: z.array(OperatingSystemRollupRowSchema),
});

export type BrowserInfo = z.infer<typeof BrowserInfoSchema>;
export type BrowserStats = z.infer<typeof BrowserStatsSchema>;
export type OperatingSystemInfo = z.infer<typeof OperatingSystemInfoSchema>;
export type OperatingSystemStats = z.infer<typeof OperatingSystemStatsSchema>;
export type DeviceType = z.infer<typeof DeviceTypeSchema>;
export type DeviceUsageTrendRow = z.infer<typeof DeviceUsageTrendRowSchema>;
export type BrowserRollupRow = z.infer<typeof BrowserRollupRowSchema>;
export type OperatingSystemRollupRow = z.infer<typeof OperatingSystemRollupRowSchema>;
export type DeviceBreakdownCombined = z.infer<typeof DeviceBreakdownCombinedSchema>;
