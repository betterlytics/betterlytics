import 'server-only';

import {
  getHeatmapClickAnchors,
  getHeatmapClickPoints,
  getHeatmapDeviceShares,
  getHeatmapPageStats,
  getHeatmapPages,
  getHeatmapSessionHeights,
  getMostVisitedHost,
  hasHeatmapClicks,
} from '@/repositories/clickhouse/clickHeatmap.repository';
import { toDateTimeString } from '@/utils/dateFormatters';
import { env } from '@/lib/env';
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

// Layouts change height with the width, so only visitors near the capture's width compare
const PAGE_HEIGHT_WIDTH_TOLERANCE = 0.1;
const MIN_PAGE_HEIGHT_SESSIONS = 5;

/**
 * The median document height visitors near a capture's width saw since it was taken, within the
 * selected period. Null when the period ends before the capture or too few sessions clicked.
 */
export async function getHeatmapPageHeightSince(
  siteQuery: BASiteQuery,
  url: string,
  device: HeatmapDevice,
  width: number,
  capturedAt: Date,
): Promise<number | null> {
  const capturedAtDateTime = toDateTimeString(capturedAt);
  const start = capturedAtDateTime > siteQuery.startDateTime ? capturedAtDateTime : siteQuery.startDateTime;
  if (start > siteQuery.endDateTime) return null;

  const widthRange = {
    min: Math.floor(width * (1 - PAGE_HEIGHT_WIDTH_TOLERANCE)),
    max: Math.ceil(width * (1 + PAGE_HEIGHT_WIDTH_TOLERANCE)),
  };
  const { documentHeight, sessions } = await getHeatmapSessionHeights(siteQuery, url, device, widthRange, start);
  return sessions >= MIN_PAGE_HEIGHT_SESSIONS && documentHeight > 0 ? documentHeight : null;
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

// In development, pages on the dashboard's own host (dashboard tracking) open on its port
function originOf(host: string) {
  const base = new URL(env.PUBLIC_BASE_URL);
  if (env.IS_DEVELOPMENT && host === base.hostname) return base.origin;
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
