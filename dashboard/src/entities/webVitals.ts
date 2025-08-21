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

export const CoreWebVitalSeriesRowSchema = z.object({
  date: z.string(),
  name: CoreWebVitalNameSchema,
  value: z.number(),
});
export type CoreWebVitalSeriesRow = z.infer<typeof CoreWebVitalSeriesRowSchema>;
