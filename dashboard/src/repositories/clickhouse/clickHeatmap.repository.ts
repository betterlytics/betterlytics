import { clickhouse } from '@/lib/clickhouse';
import { safeSql } from '@/lib/safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import {
  HEATMAP_DEVICES,
  HEATMAP_POINT_CELL_PX,
  HeatmapClickPoint,
  HeatmapClickPointSchema,
  HeatmapDevice,
  HeatmapDeviceShareRow,
  HeatmapDeviceShareRowSchema,
  HeatmapPageHeightRowSchema,
  HeatmapPageRow,
  HeatmapPageRowSchema,
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

export async function getHeatmapPageHeight(siteQuery: BASiteQuery, url: string, device: HeatmapDevice, maxHeight: number) {
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const query = safeSql`
    SELECT
      quantileExact(0.5)(document_height) AS documentHeight,
      max(page_y) AS maxY
    FROM analytics.heatmap_clicks
    WHERE site_id = {site_id:String}
      AND device = {device:String}
      AND url = {url:String}
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND NOT is_fixed
      AND page_y < {max_height:UInt32}
  `;

  const rows = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        device,
        url,
        max_height: maxHeight,
        start_date: startDateTime,
        end_date: endDateTime,
      },
    })
    .toPromise();

  return HeatmapPageHeightRowSchema.parse(rows[0] ?? { documentHeight: 0, maxY: 0 });
}
