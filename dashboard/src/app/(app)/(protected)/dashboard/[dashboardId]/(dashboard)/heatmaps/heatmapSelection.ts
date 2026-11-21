import {
  HEATMAP_DEVICES,
  type HeatmapDevice,
  type HeatmapPageRow,
} from '@/entities/analytics/clickHeatmap.entities';

/** A page to pick, with the devices it has data from, or null when that isn't known */
export type HeatmapPageOption = { url: string; devices: HeatmapDevice[] | null };

type PageSelection = { path: string | undefined; devices: HeatmapDevice[] | null; options: HeatmapPageOption[] };

/**
 * The page to show and the picker's options: the chosen page, else the most visited one with
 * heatmap data, else the most visited one. A chosen page missing from the list had no visits or
 * clicks in the period, unless the list was cut off at its limit, when its data isn't known.
 */
export function selectHeatmapPage(
  pages: HeatmapPageRow[],
  chosenPath: string | undefined,
  truncated: boolean,
): PageSelection {
  const path = chosenPath ?? (pages.find((page) => page.devices.length > 0) ?? pages[0])?.url;
  const listed = pages.find((page) => page.url === path);
  if (!path || listed) return { path, devices: listed?.devices ?? null, options: pages };
  const devices = truncated ? null : [];
  return { path, devices, options: [{ url: path, devices }, ...pages] };
}

/** Desktop, unless only other devices have data */
export function defaultHeatmapDevice(devices: HeatmapDevice[] | null): HeatmapDevice {
  return HEATMAP_DEVICES.find((device) => devices?.includes(device)) ?? HEATMAP_DEVICES[0];
}
