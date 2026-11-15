import 'server-only';

import { clickhouse } from '@/lib/clickhouse';
import { safeSql } from '@/lib/safe-sql';
import type { HeatmapCaptureSnapshotStore } from '@/repositories/heatmapCaptureSnapshots.repository';

export const clickhouseCaptureSnapshotStore: HeatmapCaptureSnapshotStore = {
  async get(siteId, captureId) {
    const query = safeSql`
      SELECT data
      FROM analytics.heatmap_captures
      WHERE site_id = {site_id:String}
        AND capture_id = {capture_id:String}
      LIMIT 1
    `;

    const result = (await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, site_id: siteId, capture_id: captureId },
      })
      .toPromise()) as { data: string }[];

    return result.length > 0 ? { body: result[0].data } : null;
  },

  async delete(siteId, captureId) {
    const query = safeSql`
      DELETE FROM analytics.heatmap_captures
      WHERE site_id = {site_id:String}
        AND capture_id = {capture_id:String}
    `;

    await clickhouse.command(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, capture_id: captureId },
    });
  },
};
