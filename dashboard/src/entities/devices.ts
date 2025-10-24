import { z } from 'zod';

export const DeviceTypeSchema = z.object({
  device_type: z.string(),
  visitors: z.number(),
});

export const BrowserInfoSchema = z.object({
  browser: z.string(),
  visitors: z.number(),
});

export const OperatingSystemInfoSchema = z.object({
  os: z.string(),
  visitors: z.number(),
});

export const BrowserStatsSchema = z.object({
  browser: z.string(),
  visitors: z.number(),
  percentage: z.number(),
});

export const OperatingSystemStatsSchema = z.object({
  os: z.string(),
  visitors: z.number(),
  percentage: z.number(),
});

export const DeviceUsageTrendRowSchema = z.object({
  date: z.string(),
  device_type: z.string(),
  count: z.number(),
});

export const BrowserRollupRowSchema = z.object({
  browser: z.string(),
  version: z.string().nullable(),
  visitors: z.number(),
  is_rollup: z.union([z.literal(0), z.literal(1)]),
});

export const OperatingSystemRollupRowSchema = z.object({
  os: z.string(),
  version: z.string().nullable(),
  visitors: z.number(),
  is_rollup: z.union([z.literal(0), z.literal(1)]),
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
