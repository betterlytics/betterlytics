import 'server-only';

import { clickhouse } from '@/lib/clickhouse';
import { safeSql } from '@/lib/safe-sql';
import type { ReplaySegmentReader } from '../replaySegments.repository';

export const clickhouseSegmentReader: ReplaySegmentReader = {
  async list(siteId, sessionId) {
    const query = safeSql`
      SELECT filename, max(size_bytes) AS size_bytes
      FROM analytics.session_replay_segments
      WHERE site_id = {site_id:String}
        AND session_id = {session_id:UInt64}
      GROUP BY filename
      ORDER BY min(epoch_ms), filename
    `;

    const result = (await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, site_id: siteId, session_id: sessionId },
      })
      .toPromise()) as { filename: string; size_bytes: string | number }[];

    return result.map((row) => ({ filename: row.filename, sizeBytes: Number(row.size_bytes) }));
  },

  async getSegment(siteId, sessionId, filename) {
    const query = safeSql`
      SELECT data
      FROM analytics.session_replay_segments
      WHERE site_id = {site_id:String}
        AND session_id = {session_id:UInt64}
        AND filename = {filename:String}
      LIMIT 1
    `;

    const result = (await clickhouse
      .query(query.taggedSql, {
        params: { ...query.taggedParams, site_id: siteId, session_id: sessionId, filename },
      })
      .toPromise()) as { data: string }[];

    return result.length > 0 ? { body: result[0].data } : null;
  },

  async stream(siteId, sessionId) {
    const query = safeSql`
      SELECT data
      FROM analytics.session_replay_segments
      WHERE site_id = {site_id:String}
        AND session_id = {session_id:UInt64}
      ORDER BY epoch_ms, filename
    `;

    // TabSeparatedRaw emits each row's data verbatim; data is JSON text, which never holds
    // a raw newline or tab, so every row is already one NDJSON line.
    const batches = await clickhouse.queryStream(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, session_id: sessionId },
      format: 'TabSeparatedRaw',
    });
    const iterator = batches[Symbol.asyncIterator]();
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        const { value, done } = await iterator.next();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(value.map((row) => row.text + '\n').join('')));
      },
      cancel() {
        void iterator.return?.(undefined);
      },
    });
  },
};
