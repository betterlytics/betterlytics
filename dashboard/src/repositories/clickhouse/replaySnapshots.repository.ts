import { clickhouse } from '@/lib/clickhouse';
import { safeSql } from '@/lib/safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import {
  HeatmapDevice,
  HeatmapReplaySnapshot,
  HeatmapReplaySnapshotSchema,
} from '@/entities/analytics/clickHeatmap.entities';

// The newest full snapshot of a page on a device, from the selected period when there is one
export async function findLatestReplaySnapshot(
  siteQuery: BASiteQuery,
  url: string,
  device: HeatmapDevice,
): Promise<HeatmapReplaySnapshot | null> {
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const query = safeSql`
    SELECT
      toString(session_id) AS sessionId,
      filename,
      snapshot_ms AS snapshotMs,
      viewport_width AS viewportWidth,
      viewport_height AS viewportHeight,
      toUnixTimestamp(timestamp) * 1000 AS recordedAtMs
    FROM analytics.session_replay_snapshots
    WHERE site_id = {site_id:String}
      AND device = {device:String}
      AND url = {url:String}
    ORDER BY timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime} DESC, timestamp DESC
    LIMIT 1
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

  return rows.length > 0 ? HeatmapReplaySnapshotSchema.parse(rows[0]) : null;
}
