import { PassThrough } from 'node:stream';
import { constants, createGzip } from 'node:zlib';
import { type NextRequest, NextResponse } from 'next/server';
import { resolveDashboardAuthResult } from '@/auth/api-auth';
import { MAX_REPLAY_STREAMS_PER_PROCESS } from '@/lib/clickhouse';
import { createConcurrencyCap } from '@/lib/concurrency-cap';
import {
  replayStreamDurationSeconds,
  replayStreamsOpen,
  replayStreamsRefusedTotal,
} from '@/lib/replay-stream.metrics';
import { throughNodeTransform } from '@/lib/web-stream-pipeline';
import { openReplaySegmentStream, type ReplaySegmentStream } from '@/services/analytics/sessionReplays.service';

const MAX_STREAMS_PER_USER = 3;
// A per-user refusal is almost always a just-aborted stream whose slot frees within ms
const RETRY_AFTER_SECONDS = { key: 1, total: 5 } as const;
// A frozen tab keeps its socket open but reads nothing; without this its slot is never freed
const STREAM_IDLE_TIMEOUT_MS = 30_000;
const acquireStreamSlot = createConcurrencyCap(MAX_STREAMS_PER_USER, MAX_REPLAY_STREAMS_PER_PROCESS);

// No completion flag exists, only ended_at; a session idle for an hour has ended and its
// bytes never change again, so the browser may skip revalidation. Only for a day though: a
// longer copy would outlive retention, deletion and revoked access on the viewer's device.
// Younger sessions revalidate after a minute: this endpoint is playback, not a realtime feed.
const SETTLED_AFTER_MS = 60 * 60_000;
const SETTLED_CACHE = 'private, max-age=86400, immutable';
const LIVE_CACHE = 'private, max-age=60';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const dashboardId = params.get('dashboardId');
  const sessionId = params.get('sessionId');
  if (!dashboardId || !sessionId || !/^\d+$/.test(sessionId)) {
    return new NextResponse(null, { status: 400 });
  }

  const result = await resolveDashboardAuthResult(dashboardId);
  if (result.error) {
    return new NextResponse(null, { status: result.error === 'unauthenticated' ? 401 : 403 });
  }
  if (result.context.isDemo) {
    return new NextResponse(null, { status: 403 });
  }

  // Acquire before the ClickHouse/S3 work starts; release only via the pipeline callback.
  const slot = acquireStreamSlot(result.context.userId);
  if ('refused' in slot) {
    replayStreamsRefusedTotal.inc({ reason: slot.refused === 'key' ? 'user' : 'process' });
    return new NextResponse(null, {
      status: 429,
      headers: { 'Retry-After': String(RETRY_AFTER_SECONDS[slot.refused]) },
    });
  }
  replayStreamsOpen.inc();
  const endTimer = replayStreamDurationSeconds.startTimer();
  let released = false;
  const release = (outcome: 'ok' | 'aborted' | 'error' | 'not_found') => {
    if (released) return;
    released = true;
    slot.release();
    replayStreamsOpen.dec();
    endTimer({ outcome });
  };

  let opened: ReplaySegmentStream | null;
  try {
    opened = await openReplaySegmentStream(result.context, sessionId);
  } catch (error) {
    release('error');
    throw error;
  }
  if (!opened) {
    release('not_found');
    return new NextResponse(null, { status: 404 });
  }

  // zlib with a sync flush per chunk, not CompressionStream: the latter buffers until end of input
  const gzip = /\bgzip\b/.test(request.headers.get('accept-encoding') ?? '');
  const body = throughNodeTransform(
    opened.stream,
    gzip ? createGzip({ flush: constants.Z_SYNC_FLUSH }) : new PassThrough(),
    (error) => {
      if (!error) return release('ok');
      // The browser cancelled: the user switched session or closed the tab
      if (error.name === 'AbortError') return release('aborted');
      console.error('[replay] stream failed mid-download:', error);
      release('error');
    },
    STREAM_IDLE_TIMEOUT_MS,
  );
  const settled = Date.now() - opened.endedAt.getTime() > SETTLED_AFTER_MS;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      ...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
      'Cache-Control': settled ? SETTLED_CACHE : LIVE_CACHE,
      Vary: 'Accept-Encoding',
      'X-Accel-Buffering': 'no',
    },
  });
}
