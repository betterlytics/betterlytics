import 'server-only';

import { clickhouseSegmentReader } from './clickhouse/replaySegments.repository';
import { s3SegmentReader } from './s3/replaySegments.repository';

// Both storage backends answer the same two questions; picked PER SESSION via the
// storage marker on analytics.session_replays, never directly from env.
export interface ReplaySegmentReader {
  list(siteId: string, sessionId: string): Promise<{ filename: string; sizeBytes: number }[]>;
  // body: decompressed JSON text (clickhouse) or the stored gzip byte stream (s3);
  // contentEncoding is set when the bytes are still compressed
  getSegment(
    siteId: string,
    sessionId: string,
    filename: string,
  ): Promise<{ body: string | ReadableStream; contentEncoding?: string } | null>;
}

export function readerFor(storage: 's3' | 'clickhouse'): ReplaySegmentReader {
  return storage === 'clickhouse' ? clickhouseSegmentReader : s3SegmentReader;
}
