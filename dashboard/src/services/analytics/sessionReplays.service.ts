import 'server-only';

import { getSessionReplays } from '@/repositories/clickhouse/index.repository';
import { getReplaySessionMeta, getSessionReplayById } from '@/repositories/clickhouse/sessionReplays.repository';
import { readerFor, type ReplaySegmentReader } from '@/repositories/replaySegments.repository';
import { replayStorage } from '@/lib/env';
import { DEMO_SESSION_REPLAYS } from '@/constants/demoSessionReplays';
import type { AuthContext } from '@/entities/auth/authContext.entities';
import type { SessionReplay } from '@/entities/analytics/sessionReplays.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { demoNow, demoReplayWindow } from '@/utils/demoData';

const STREAM_PREFETCH_AHEAD = 4;

export async function getSessionReplaysForSite(
  authContext: AuthContext,
  siteQuery: BASiteQuery,
  limit: number,
  offset: number,
): Promise<SessionReplay[]> {
  if (authContext.isDemo) {
    return getDemoSessionReplays(authContext.siteId)
      .filter((replay) => replay.started_at >= siteQuery.startDate && replay.started_at <= siteQuery.endDate)
      .slice(offset, offset + limit);
  }
  return getSessionReplays(siteQuery, limit, offset);
}

export async function getSessionReplayForSite(
  authContext: AuthContext,
  sessionId: string,
): Promise<SessionReplay | null> {
  if (authContext.isDemo) {
    return getDemoSessionReplays(authContext.siteId).find((replay) => replay.session_id === sessionId) ?? null;
  }
  return getSessionReplayById(authContext.siteId, sessionId);
}

function getDemoSessionReplays(siteId: string): SessionReplay[] {
  const now = demoNow();
  return DEMO_SESSION_REPLAYS.map(({ endedMinutesAgo, ...replay }) => {
    const recorded = demoReplayWindow({ endedMinutesAgo, duration: replay.duration }, now);
    const startedAt = new Date(recorded.startedAt);
    return {
      ...replay,
      site_id: siteId,
      started_at: startedAt,
      ended_at: new Date(recorded.endedAt),
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

async function readerForSession(siteId: string, sessionId: string) {
  const meta = await getReplaySessionMeta(siteId, sessionId);
  // A missing or unrecognized marker falls back to the deployment's active mode; in a
  // ClickHouse-only deploy the S3 reader is unreachable that way (its client throws).
  const storage = meta?.storage === 's3' || meta?.storage === 'clickhouse' ? meta.storage : replayStorage;
  return { reader: readerFor(storage), meta };
}

export async function openReplaySegmentStream(
  authContext: AuthContext,
  sessionId: string,
): Promise<ReplaySegmentStream | null> {
  const { siteId } = authContext;
  const { reader, meta } = await readerForSession(siteId, sessionId);
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

/**
 * The events a heatmap needs to draw one full snapshot, as a JSON array: the snapshot's segment,
 * plus the next one while the moments after the snapshot continue there. A large snapshot gets a
 * segment of its own, and an in-app navigation renders the new page just after its snapshot.
 */
export async function openReplaySnapshotEvents(
  authContext: AuthContext,
  sessionId: string,
  filename: string,
  untilMs: number,
): Promise<string | null> {
  const { siteId } = authContext;
  const { reader } = await readerForSession(siteId, sessionId);
  const first = await segmentToText(await reader.getSegment(siteId, sessionId, filename));
  if (first === null) return null;

  const texts = [first];
  // Segment filenames start with the client time of their last event
  if (Number(filename.slice(0, 13)) < untilMs) {
    const filenames = (await reader.list(siteId, sessionId)).map((segment) => segment.filename);
    const index = filenames.indexOf(filename);
    const next = index === -1 ? undefined : filenames[index + 1];
    const text = next ? await segmentToText(await reader.getSegment(siteId, sessionId, next)) : null;
    if (text !== null) texts.push(text);
  }
  const items = texts.map((text) => text.trim().slice(1, -1).trim()).filter(Boolean);
  return `[${items.join(',')}]`;
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
