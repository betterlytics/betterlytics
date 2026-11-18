import { z } from 'zod';

export const HEATMAP_DEVICES = ['desktop', 'tablet', 'mobile'] as const;

export const HeatmapDeviceSchema = z.enum(HEATMAP_DEVICES);

export type HeatmapDevice = z.infer<typeof HeatmapDeviceSchema>;

export const HEATMAP_DEVICE_WIDTHS: Record<HeatmapDevice, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 390,
};

// The backend's device buckets by viewport width: mobile under 576, tablet up to 991
export const HEATMAP_DESKTOP_MIN_WIDTH = 992;

export const HEATMAP_MAX_PAGE_HEIGHT = 20000;

export const HEATMAP_POINT_CELL_PX = 4;

export const HeatmapPageRowSchema = z.object({
  url: z.string(),
  clicks: z.coerce.number(),
});

export type HeatmapPageRow = z.infer<typeof HeatmapPageRowSchema>;

export const HeatmapDeviceShareRowSchema = z.object({
  device: HeatmapDeviceSchema,
  clicks: z.coerce.number(),
});

export type HeatmapDeviceShareRow = z.infer<typeof HeatmapDeviceShareRowSchema>;

export const HeatmapClickPointSchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number(),
  count: z.coerce.number(),
});

export type HeatmapClickPoint = z.infer<typeof HeatmapClickPointSchema>;

export const HeatmapPageStatsRowSchema = z.object({
  documentHeight: z.coerce.number(),
  fixedClicks: z.coerce.number(),
});

export type HeatmapPageStatsRow = z.infer<typeof HeatmapPageStatsRowSchema>;

export type HeatmapClicks = {
  width: number;
  height: number;
  points: HeatmapClickPoint[];
  fixedClicks: number;
};

// Changes right after a snapshot are applied too: an in-app navigation snapshots the page
// before the new route has rendered, and lazy content arrives just after load
export const SNAPSHOT_SETTLE_MS = 3000;

// Clicks grouped by element anchor, with the group's average page position for when the
// background doesn't have the element
export const HeatmapClickAnchorSchema = z.object({
  selector: z.string(),
  offsetX: z.coerce.number(),
  offsetY: z.coerce.number(),
  x: z.coerce.number(),
  y: z.coerce.number(),
  fixed: z.coerce.number().transform((value) => value === 1),
  count: z.coerce.number(),
});

export type HeatmapClickAnchor = z.infer<typeof HeatmapClickAnchorSchema>;

export const HeatmapReplaySnapshotSchema = z.object({
  sessionId: z.string(),
  filename: z.string(),
  snapshotMs: z.coerce.number(),
  viewportWidth: z.coerce.number(),
  viewportHeight: z.coerce.number(),
  recordedAtMs: z.coerce.number(),
});

export type HeatmapReplaySnapshot = z.infer<typeof HeatmapReplaySnapshotSchema>;

export type HeatmapBackground = { kind: 'replay'; snapshot: HeatmapReplaySnapshot } | { kind: 'none' };
