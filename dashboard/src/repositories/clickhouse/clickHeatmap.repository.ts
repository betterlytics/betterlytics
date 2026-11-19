import { clickhouse } from '@/lib/clickhouse';
import { safeSql } from '@/lib/safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import {
  HEATMAP_DEVICES,
  HEATMAP_POINT_CELL_PX,
  HeatmapClickAnchor,
  HeatmapClickAnchorSchema,
  HeatmapClickPoint,
  HeatmapClickPointSchema,
  HeatmapDevice,
  HeatmapDeviceShareRow,
  HeatmapDeviceShareRowSchema,
  HeatmapPageRow,
  HeatmapPageRowSchema,
  HeatmapPageStatsRow,
  HeatmapPageStatsRowSchema,
  HeatmapSessionHeightsRow,
  HeatmapSessionHeightsRowSchema,
} from '@/entities/analytics/clickHeatmap.entities';

const MAX_POINTS = 20000;

export async function hasHeatmapClicks(siteId: string): Promise<boolean> {
  const query = safeSql`
    SELECT 1
    FROM analytics.heatmap_clicks
    WHERE site_id = {site_id:String}
    LIMIT 1
  `;

  const result = await clickhouse
    .query(query.taggedSql, { params: { ...query.taggedParams, site_id: siteId } })
    .toPromise();

  return result.length > 0;
}

export async function getHeatmapPages(siteQuery: BASiteQuery, limit: number): Promise<HeatmapPageRow[]> {
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const query = safeSql`
    SELECT url, count() AS clicks
    FROM analytics.heatmap_clicks
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
    GROUP BY url
    ORDER BY clicks DESC, url ASC
    LIMIT {limit:UInt32}
  `;

  const rows = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDateTime,
        end_date: endDateTime,
        limit,
      },
    })
    .toPromise();

  return rows.map((row) => HeatmapPageRowSchema.parse(row));
}

export async function getHeatmapDeviceShares(siteQuery: BASiteQuery, url: string): Promise<HeatmapDeviceShareRow[]> {
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const query = safeSql`
    SELECT device, count() AS clicks
    FROM analytics.heatmap_clicks
    WHERE site_id = {site_id:String}
      AND url = {url:String}
      AND device IN {devices:Array(String)}
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
    GROUP BY device
  `;

  const rows = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        url,
        devices: HEATMAP_DEVICES,
        start_date: startDateTime,
        end_date: endDateTime,
      },
    })
    .toPromise();

  return rows.map((row) => HeatmapDeviceShareRowSchema.parse(row));
}

export async function getHeatmapClickPoints(
  siteQuery: BASiteQuery,
  url: string,
  device: HeatmapDevice,
  width: number,
  maxHeight: number,
): Promise<HeatmapClickPoint[]> {
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const query = safeSql`
    SELECT
      intDiv(toUInt32(round(page_x * {width:UInt32} / greatest(viewport_width, 1))), {cell:UInt32}) * {cell:UInt32} AS x,
      intDiv(page_y, {cell:UInt32}) * {cell:UInt32} AS y,
      count() AS count
    FROM analytics.heatmap_clicks
    WHERE site_id = {site_id:String}
      AND device = {device:String}
      AND url = {url:String}
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND NOT is_fixed
      AND page_y < {max_height:UInt32}
    GROUP BY x, y
    HAVING x < {width:UInt32}
    ORDER BY count DESC
    LIMIT {limit:UInt32}
  `;

  const rows = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        device,
        url,
        width,
        cell: HEATMAP_POINT_CELL_PX,
        max_height: maxHeight,
        start_date: startDateTime,
        end_date: endDateTime,
        limit: MAX_POINTS,
      },
    })
    .toPromise();

  return rows.map((row) => HeatmapClickPointSchema.parse(row));
}

// Offsets are rounded to 5% of the element so clicks from different window widths share a
// row; the group's average page position is where it is drawn without its element
export async function getHeatmapClickAnchors(
  siteQuery: BASiteQuery,
  url: string,
  device: HeatmapDevice,
  width: number,
  maxHeight: number,
): Promise<HeatmapClickAnchor[]> {
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const query = safeSql`
    SELECT
      selector,
      round(offset_x * 20) / 20 AS offsetX,
      round(offset_y * 20) / 20 AS offsetY,
      round(avg(page_x * {width:UInt32} / greatest(viewport_width, 1))) AS x,
      round(avg(page_y)) AS y,
      toUInt8(is_fixed) AS fixed,
      count() AS count
    FROM analytics.heatmap_clicks
    WHERE site_id = {site_id:String}
      AND device = {device:String}
      AND url = {url:String}
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND page_y < {max_height:UInt32}
    GROUP BY selector, offsetX, offsetY, fixed
    ORDER BY count DESC
    LIMIT {limit:UInt32}
  `;

  const rows = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        device,
        url,
        width,
        max_height: maxHeight,
        start_date: startDateTime,
        end_date: endDateTime,
        limit: MAX_POINTS,
      },
    })
    .toPromise();

  return rows.map((row) => HeatmapClickAnchorSchema.parse(row));
}

// The host on the dashboard's domain that visitors opened a page on most. Pageviews keep the
// host, heatmap clicks don't; any host can be sent in a pageview, and capture uploads are only
// accepted from the domain or its subdomains.
export async function getMostVisitedHost(
  siteQuery: BASiteQuery,
  url: string,
  dashboardDomain: string,
): Promise<string | null> {
  const { siteId, startDateTime, endDateTime } = siteQuery;
  const domain = dashboardDomain.toLowerCase();

  const query = safeSql`
    SELECT domain
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'pageview'
      AND url = {url:String}
      AND (domain = {dashboard_domain:String} OR endsWith(domain, {dot_domain:String}))
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
    GROUP BY domain
    ORDER BY count() DESC
    LIMIT 1
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        url,
        dashboard_domain: domain,
        dot_domain: `.${domain}`,
        start_date: startDateTime,
        end_date: endDateTime,
      },
    })
    .toPromise()) as { domain: string }[];

  return rows[0]?.domain ?? null;
}

// The median document height over sessions at a window width range, one height per session
// (its smallest), so visitors who click a lot and open more of the page don't outweigh the rest
export async function getHeatmapSessionHeights(
  siteQuery: BASiteQuery,
  url: string,
  device: HeatmapDevice,
  widthRange: { min: number; max: number },
  startDateTime: string,
): Promise<HeatmapSessionHeightsRow> {
  const { siteId, endDateTime } = siteQuery;

  const query = safeSql`
    SELECT
      quantileExact(0.5)(height) AS documentHeight,
      count() AS sessions
    FROM (
      SELECT min(document_height) AS height
      FROM analytics.heatmap_clicks
      WHERE site_id = {site_id:String}
        AND device = {device:String}
        AND url = {url:String}
        AND viewport_width BETWEEN {min_width:UInt16} AND {max_width:UInt16}
        AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      GROUP BY session_id
    )
  `;

  const rows = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        device,
        url,
        min_width: widthRange.min,
        max_width: widthRange.max,
        start_date: startDateTime,
        end_date: endDateTime,
      },
    })
    .toPromise();

  return HeatmapSessionHeightsRowSchema.parse(rows[0] ?? { documentHeight: 0, sessions: 0 });
}

export async function getHeatmapPageStats(
  siteQuery: BASiteQuery,
  url: string,
  device: HeatmapDevice,
): Promise<HeatmapPageStatsRow> {
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const query = safeSql`
    SELECT
      quantileExact(0.5)(document_height) AS documentHeight,
      countIf(is_fixed) AS fixedClicks
    FROM analytics.heatmap_clicks
    WHERE site_id = {site_id:String}
      AND device = {device:String}
      AND url = {url:String}
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
  `;

  const rows = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        device,
        url,
        start_date: startDateTime,
        end_date: endDateTime,
      },
    })
    .toPromise();

  return HeatmapPageStatsRowSchema.parse(rows[0] ?? { documentHeight: 0, fixedClicks: 0 });
}
