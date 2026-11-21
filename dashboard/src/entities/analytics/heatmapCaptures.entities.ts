import { z } from 'zod';
import { HeatmapDeviceSchema } from '@/entities/analytics/clickHeatmap.entities';

export { HeatmapDeviceSchema, type HeatmapDevice } from '@/entities/analytics/clickHeatmap.entities';

export const HEATMAP_CAPTURE_LINK_TTL_MS = 15 * 60_000;
export const MAX_UNUSED_HEATMAP_CAPTURE_LINKS = 3;

export const HeatmapPagePathSchema = z
  .string()
  .min(1)
  .max(2048)
  .startsWith('/')
  .refine((path) => !/[\u0000-\u001f\u007f]/.test(path), 'Invalid path');

export const CreateHeatmapCaptureLinkSchema = z.object({
  path: HeatmapPagePathSchema,
  device: HeatmapDeviceSchema,
});
export type CreateHeatmapCaptureLinkInput = z.infer<typeof CreateHeatmapCaptureLinkSchema>;

export const HeatmapCaptureFilterSchema = z.object({
  path: HeatmapPagePathSchema.optional(),
  device: HeatmapDeviceSchema.optional(),
});
export type HeatmapCaptureFilter = z.infer<typeof HeatmapCaptureFilterSchema>;

export const HeatmapCaptureStorageSchema = z.enum(['clickhouse', 's3']);
export type HeatmapCaptureStorage = z.infer<typeof HeatmapCaptureStorageSchema>;

export const HeatmapCaptureSchema = z.object({
  id: z.string(),
  dashboardId: z.string(),
  path: z.string(),
  device: HeatmapDeviceSchema,
  viewportWidth: z.number().int(),
  documentHeight: z.number().int(),
  sizeBytes: z.number().int(),
  createdAt: z.date(),
  createdById: z.string().nullable(),
  createdByName: z.string().nullable(),
  capturedFromUrl: z.string(),
});
export type HeatmapCapture = z.infer<typeof HeatmapCaptureSchema>;

export const HeatmapCaptureLocationSchema = z.object({
  storage: HeatmapCaptureStorageSchema,
  storageKey: z.string(),
});
export type HeatmapCaptureLocation = z.infer<typeof HeatmapCaptureLocationSchema>;
