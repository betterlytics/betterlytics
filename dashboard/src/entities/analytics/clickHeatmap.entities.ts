import { z } from 'zod';

export const HEATMAP_DEVICES = ['desktop', 'tablet', 'mobile'] as const;

export const HeatmapDeviceSchema = z.enum(HEATMAP_DEVICES);

export type HeatmapDevice = z.infer<typeof HeatmapDeviceSchema>;

export const HEATMAP_DEVICE_WIDTHS: Record<HeatmapDevice, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 390,
};

// Window widths with the scrollbar that each device covers, as the backend buckets them
export const HEATMAP_DEVICE_WINDOW_RANGES: Record<HeatmapDevice, { min: number; max: number }> = {
  desktop: { min: 992, max: Infinity },
  tablet: { min: 576, max: 991 },
  mobile: { min: 1, max: 575 },
};

// A typical window height per device, for pages shown the way visitors saw them
export const HEATMAP_DEVICE_VIEWPORT_HEIGHTS: Record<HeatmapDevice, number> = {
  desktop: 900,
  tablet: 1024,
  mobile: 844,
};

export const HEATMAP_MAX_PAGE_HEIGHT = 20000;

// Every page is loaded at once and searched in the browser, like filter values
export const HEATMAP_PAGE_LIMIT = 5000;

export const HEATMAP_POINT_CELL_PX = 4;

// A page visited in the period, with the devices it has heatmap clicks from in that period
export const HeatmapPageRowSchema = z.object({
  url: z.string(),
  devices: z.array(HeatmapDeviceSchema),
});

export type HeatmapPageRow = z.infer<typeof HeatmapPageRowSchema>;

export const HeatmapClickPointSchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number(),
  count: z.coerce.number(),
});

export type HeatmapClickPoint = z.infer<typeof HeatmapClickPointSchema>;

export type HeatmapClicks = {
  width: number;
  points: HeatmapClickPoint[];
};

// Changes right after a snapshot are applied too: an in-app navigation snapshots the page
// before the new route has rendered, and lazy content arrives just after load
export const SNAPSHOT_SETTLE_MS = 3000;

// Clicks grouped by element anchor, with the group's average page position, also as a share of
// the page's height (relY), to tell look-alike elements on the background apart. Clicks on the
// page itself have no element to anchor to and are drawn at that position.
export const HeatmapClickAnchorSchema = z.object({
  selector: z.string(),
  offsetX: z.coerce.number(),
  offsetY: z.coerce.number(),
  x: z.coerce.number(),
  y: z.coerce.number(),
  relY: z.coerce.number(),
  fixed: z.coerce.number().transform((value) => value === 1),
  onPage: z.coerce.number().transform((value) => value === 1),
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
