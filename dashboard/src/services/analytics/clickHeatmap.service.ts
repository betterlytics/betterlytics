import 'server-only';

import {
  getHeatmapClickAnchors,
  getHeatmapClickPoints,
  getHeatmapDeviceShares,
  getHeatmapPageStats,
  getHeatmapPages,
  getMostVisitedHost,
  hasHeatmapClicks,
} from '@/repositories/clickhouse/clickHeatmap.repository';
import { findDashboardById } from '@/repositories/postgres/dashboard.repository';
import { findLatestReplaySnapshot } from '@/repositories/clickhouse/replaySnapshots.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import {
  HEATMAP_DEVICES,
  HEATMAP_DEVICE_WIDTHS,
  HEATMAP_MAX_PAGE_HEIGHT,
  HEATMAP_POINT_CELL_PX,
  HeatmapBackground,
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

export async function getHeatmapBackground(
  siteQuery: BASiteQuery,
  url: string,
  device: HeatmapDevice,
): Promise<HeatmapBackground> {
  const snapshot = await findLatestReplaySnapshot(siteQuery, url, device);
  return snapshot ? { kind: 'replay', snapshot } : { kind: 'none' };
}

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$/;

/**
 * Where a capture opens the page: the host most visitors used, else the dashboard's domain.
 * Pageviews keep no scheme or port, so local hosts get http and everything else https; a
 * different address on the dashboard's domain can be entered in the capture dialog.
 */
export async function getCaptureOrigin(siteQuery: BASiteQuery, dashboardId: string, url: string) {
  const { origin, domain } = await getVisitedOrigin(siteQuery, dashboardId, url);
  return { origin: origin ?? originOf(domain), domain };
}

/** The origin on the dashboard's domain that visitors opened a page on most, or null without any */
export async function getVisitedOrigin(siteQuery: BASiteQuery, dashboardId: string, url: string) {
  const dashboard = await findDashboardById(dashboardId);
  const host = await getMostVisitedHost(siteQuery, url, dashboard.domain);
  return { origin: host ? originOf(host) : null, domain: dashboard.domain };
}

function originOf(host: string) {
  return `${LOCAL_HOST.test(host) ? 'http' : 'https'}://${host}`;
}

export async function getHeatmapClickAnchorsForPage(
  siteQuery: BASiteQuery,
  url: string,
  device: HeatmapDevice,
  width: number,
) {
  return getHeatmapClickAnchors(siteQuery, url, device, width, HEATMAP_MAX_PAGE_HEIGHT);
}
