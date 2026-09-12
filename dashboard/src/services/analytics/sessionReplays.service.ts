import 'server-only';

import { getSessionReplays } from '@/repositories/clickhouse/index.repository';
import { getReplayStorageForSession } from '@/repositories/clickhouse/sessionReplays.repository';
import { readerFor, type ReplaySegmentReader } from '@/repositories/replaySegments.repository';
import { replayStorage } from '@/lib/env';
import type { AuthContext } from '@/entities/auth/authContext.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const STREAM_PREFETCH_AHEAD = 4;

export async function getSessionReplaysForSite(siteQuery: BASiteQuery, limit: number, offset: number) {
  return getSessionReplays(siteQuery, limit, offset);
}

export async function openReplaySegmentStream(
  authContext: AuthContext,
  sessionId: string,
): Promise<ReadableStream<Uint8Array> | null> {
  const { siteId } = authContext;
  const reader = readerFor(await resolveReplayStorage(siteId, sessionId));
  const segments = await reader.list(siteId, sessionId);
  if (segments.length === 0) return null;
  if (reader.stream) return reader.stream(siteId, sessionId);
  return toNdjsonStream(
    streamSegments(
      reader,
      siteId,
      sessionId,
      segments.map((segment) => segment.filename),
    ),
  );
}

function toNdjsonStream(lines: AsyncGenerator<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await lines.next();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(value + '\n'));
    },
    cancel() {
      void lines.return(undefined);
    },
  });
}

async function* streamSegments(
  reader: ReplaySegmentReader,
  siteId: string,
  sessionId: string,
  filenames: string[],
): AsyncGenerator<string> {
  const inflight: Promise<string | null>[] = [];
  let next = 0;
  const startNext = () => {
    if (next < filenames.length) {
      const pending = reader.getSegment(siteId, sessionId, filenames[next++]).then(segmentToText);
      pending.catch(() => {});
      inflight.push(pending);
    }
  };
  for (let i = 0; i < STREAM_PREFETCH_AHEAD; i++) startNext();
  while (inflight.length > 0) {
    const text = await inflight.shift()!;
    startNext();
    if (text) yield text;
  }
}

async function segmentToText(
  segment: Awaited<ReturnType<ReplaySegmentReader['getSegment']>>,
): Promise<string | null> {
  if (!segment) return null;
  if (typeof segment.body === 'string') return segment.body;
  const stream =
    segment.contentEncoding === 'gzip' ? segment.body.pipeThrough(new DecompressionStream('gzip')) : segment.body;
  return new Response(stream).text();
}

// A missing or unrecognized marker falls back to the deployment's active mode; in a
// ClickHouse-only deploy the S3 reader is unreachable that way (its client throws).
async function resolveReplayStorage(siteId: string, sessionId: string): Promise<'s3' | 'clickhouse'> {
  const marker = await getReplayStorageForSession(siteId, sessionId);
  return marker === 's3' || marker === 'clickhouse' ? marker : replayStorage;
}
