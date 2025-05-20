import { z } from "zod";

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

export const DeviceSummarySchema = z.object({
    distinctDeviceCount: z.number(),
    topDevice: z.object({
        name: z.string(),
        visitors: z.number(),
        percentage: z.number(),
    }),
    topBrowser: z.object({
        name: z.string(),
        visitors: z.number(),
        percentage: z.number(),
    }),
    topOs: z.object({
        name: z.string(),
        visitors: z.number(),
        percentage: z.number(),
    }),
});

export const DeviceUsageTrendRowSchema = z.object({
  date: z.string(),
  device_type: z.string(),
  count: z.number(),
});

export type BrowserInfo = z.infer<typeof BrowserInfoSchema>;
export type BrowserStats = z.infer<typeof BrowserStatsSchema>;
export type OperatingSystemInfo = z.infer<typeof OperatingSystemInfoSchema>;
export type OperatingSystemStats = z.infer<typeof OperatingSystemStatsSchema>;
export type DeviceType = z.infer<typeof DeviceTypeSchema>;
export type DeviceSummary = z.infer<typeof DeviceSummarySchema>;
export type DeviceUsageTrendRow = z.infer<typeof DeviceUsageTrendRowSchema>;