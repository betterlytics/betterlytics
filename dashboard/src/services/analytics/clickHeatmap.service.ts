import 'server-only';

import {
  getHeatmapClickPoints,
  getHeatmapDeviceShares,
  getHeatmapPageStats,
  getHeatmapPages,
  hasHeatmapClicks,
} from '@/repositories/clickhouse/clickHeatmap.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import {
  HEATMAP_DEVICES,
  HEATMAP_DEVICE_WIDTHS,
  HEATMAP_MAX_PAGE_HEIGHT,
  HEATMAP_POINT_CELL_PX,
  HeatmapClicks,
  HeatmapDevice,
} from '@/entities/analytics/clickHeatmap.entities';

const HEATMAP_PAGE_LIMIT = 200;
const PAGE_BOTTOM_MARGIN_PX = 40;

export async function getHasHeatmapClicks(siteId: string): Promise<boolean> {
  return hasHeatmapClicks(siteId);
}

export async function getHeatmapPagesForSite(siteQuery: BASiteQuery) {
  return getHeatmapPages(siteQuery, HEATMAP_PAGE_LIMIT);
}

export async function getHeatmapDeviceSharesForPage(siteQuery: BASiteQuery, url: string) {
  const rows = await getHeatmapDeviceShares(siteQuery, url);
  return HEATMAP_DEVICES.map((device) => ({
    device,
    clicks: rows.find((row) => row.device === device)?.clicks ?? 0,
  }));
}

export async function getHeatmapClicksForPage(
  siteQuery: BASiteQuery,
  url: string,
  device: HeatmapDevice,
): Promise<HeatmapClicks> {
  const width = HEATMAP_DEVICE_WIDTHS[device];
  const [points, { documentHeight, fixedClicks }] = await Promise.all([
    getHeatmapClickPoints(siteQuery, url, device, width, HEATMAP_MAX_PAGE_HEIGHT),
    getHeatmapPageStats(siteQuery, url, device),
  ]);

  const lowestClick = points.reduce((max, point) => Math.max(max, point.y + HEATMAP_POINT_CELL_PX), 0);
  const height = Math.min(
    Math.max(documentHeight, lowestClick + PAGE_BOTTOM_MARGIN_PX, 1),
    HEATMAP_MAX_PAGE_HEIGHT,
  );

  return { width, height, points, fixedClicks };
}
