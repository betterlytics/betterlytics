import { z } from 'zod';

export const CoreWebVitalNameSchema = z.enum(['CLS', 'LCP', 'INP', 'FCP', 'TTFB']);
export type CoreWebVitalName = z.infer<typeof CoreWebVitalNameSchema>;
export const CORE_WEB_VITAL_NAMES: CoreWebVitalName[] = CoreWebVitalNameSchema.options;

export const CoreWebVitalsSummarySchema = z.object({
  clsP75: z.number().nullable(),
  lcpP75: z.number().nullable(),
  inpP75: z.number().nullable(),
  fcpP75: z.number().nullable(),
  ttfbP75: z.number().nullable(),
});
export type CoreWebVitalsSummary = z.infer<typeof CoreWebVitalsSummarySchema>;

export const CoreWebVitalRowSchema = z.object({
  name: CoreWebVitalNameSchema,
  p75: z.number().nullable(),
});
export type CoreWebVitalRow = z.infer<typeof CoreWebVitalRowSchema>;

export const CoreWebVitalNamedPercentilesRowSchema = z.object({
  date: z.string(),
  name: CoreWebVitalNameSchema.or(z.literal('')),
  p50: z.number().or(z.null()),
  p75: z.number().or(z.null()),
  p90: z.number().or(z.null()),
  p99: z.number().or(z.null()),
});
export type CoreWebVitalNamedPercentilesRow = z.infer<typeof CoreWebVitalNamedPercentilesRowSchema>;

export type CWVDimension = 'device_type' | 'country_code' | 'url' | 'browser' | 'os';

export const CoreWebVitalsAllPercentilesPerDimensionRowSchema = z.object({
  key: z.string(),
  name: CoreWebVitalNameSchema,
  p50: z.number().nullable(),
  p75: z.number().nullable(),
  p90: z.number().nullable(),
  p99: z.number().nullable(),
  samples: z.number(),
});

export type CoreWebVitalsAllPercentilesPerDimensionRow = z.infer<
  typeof CoreWebVitalsAllPercentilesPerDimensionRowSchema
>;
