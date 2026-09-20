import { PassThrough } from 'node:stream';
import { constants, createGzip } from 'node:zlib';
import { type NextRequest, NextResponse } from 'next/server';
import { resolveDashboardAuthResult } from '@/auth/api-auth';
import { createConcurrencyCap } from '@/lib/concurrency-cap';
import {
  replayStreamDurationSeconds,
  replayStreamsOpen,
  replayStreamsRefusedTotal,
} from '@/lib/replay-stream.metrics';
import { throughNodeTransform } from '@/lib/web-stream-pipeline';
import { openReplaySegmentStream, type ReplaySegmentStream } from '@/services/analytics/sessionReplays.service';

const MAX_STREAMS_PER_USER = 3;
const MAX_STREAMS_PER_PROCESS = 24;
const STREAM_RETRY_AFTER_SECONDS = 5;
const acquireStreamSlot = createConcurrencyCap(MAX_STREAMS_PER_USER, MAX_STREAMS_PER_PROCESS);

// No completion flag exists, only ended_at; a session idle for an hour has ended and its
// bytes never change again, so the browser may keep it for good. Younger sessions revalidate
// after a minute: this endpoint is playback, not a realtime feed.
const SETTLED_AFTER_MS = 60 * 60_000;
const SETTLED_CACHE = 'private, max-age=31536000, immutable';
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
    return new NextResponse(null, { status: 429, headers: { 'Retry-After': String(STREAM_RETRY_AFTER_SECONDS) } });
  }
  replayStreamsOpen.inc();
  const endTimer = replayStreamDurationSeconds.startTimer();
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    slot.release();
    replayStreamsOpen.dec();
    endTimer();
  };

  let opened: ReplaySegmentStream | null;
  try {
    opened = await openReplaySegmentStream(result.context, sessionId);
  } catch (error) {
    release();
    throw error;
  }
  if (!opened) {
    release();
    return new NextResponse(null, { status: 404 });
  }

  // zlib with a sync flush per chunk, not CompressionStream: the latter buffers until end of input
  const gzip = /\bgzip\b/.test(request.headers.get('accept-encoding') ?? '');
  const body = throughNodeTransform(
    opened.stream,
    gzip ? createGzip({ flush: constants.Z_SYNC_FLUSH }) : new PassThrough(),
    () => release(),
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
