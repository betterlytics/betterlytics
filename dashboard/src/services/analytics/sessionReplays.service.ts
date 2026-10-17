import 'server-only';

import { getSessionReplays } from '@/repositories/clickhouse/index.repository';
import { getReplaySessionMeta } from '@/repositories/clickhouse/sessionReplays.repository';
import { readerFor, type ReplaySegmentReader } from '@/repositories/replaySegments.repository';
import { replayStorage } from '@/lib/env';
import { DEMO_SESSION_REPLAYS } from '@/constants/demoSessionReplays';
import type { AuthContext } from '@/entities/auth/authContext.entities';
import type { SessionReplay } from '@/entities/analytics/sessionReplays.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const STREAM_PREFETCH_AHEAD = 4;

export async function getSessionReplaysForSite(
  authContext: AuthContext,
  siteQuery: BASiteQuery,
  limit: number,
  offset: number,
): Promise<SessionReplay[]> {
  if (authContext.isDemo) {
    return getDemoSessionReplays(authContext.siteId).slice(offset, offset + limit);
  }
  return getSessionReplays(siteQuery, limit, offset);
}

// Fixed recordings, re-dated on every request so the demo always shows recent sessions
function getDemoSessionReplays(siteId: string): SessionReplay[] {
  const now = Date.now();
  return DEMO_SESSION_REPLAYS.map(({ endedMinutesAgo, ...replay }) => {
    const endedAt = new Date(now - endedMinutesAgo * 60_000);
    const startedAt = new Date(endedAt.getTime() - replay.duration * 1000);
    return {
      ...replay,
      site_id: siteId,
      started_at: startedAt,
      ended_at: endedAt,
      date: startedAt.toISOString().slice(0, 10),
      s3_prefix: '',
    };
  });
}

export function getDemoReplayFixturePath(sessionId: string): string | null {
  const known = DEMO_SESSION_REPLAYS.some((replay) => replay.session_id === sessionId);
  return known ? `/demo-replays/${sessionId}.ndjson` : null;
}

export type ReplaySegmentStream = { stream: ReadableStream<Uint8Array>; endedAt: Date };

export async function openReplaySegmentStream(
  authContext: AuthContext,
  sessionId: string,
): Promise<ReplaySegmentStream | null> {
  const { siteId } = authContext;
  const meta = await getReplaySessionMeta(siteId, sessionId);
  // A missing or unrecognized marker falls back to the deployment's active mode; in a
  // ClickHouse-only deploy the S3 reader is unreachable that way (its client throws).
  const storage = meta?.storage === 's3' || meta?.storage === 'clickhouse' ? meta.storage : replayStorage;
  const reader = readerFor(storage);
  const segments = await reader.list(siteId, sessionId);
  if (segments.length === 0) return null;
  // A segment row without a session row is a race at ingest; treat it as still recording.
  const endedAt = meta?.endedAt ?? new Date();
  const stream = reader.stream
    ? await reader.stream(siteId, sessionId)
    : toNdjsonStream(
        streamSegments(
          reader,
          siteId,
          sessionId,
          segments.map((segment) => segment.filename),
        ),
      );
  return { stream, endedAt };
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
