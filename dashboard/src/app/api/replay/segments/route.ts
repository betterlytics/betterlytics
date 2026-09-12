import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { constants, createGzip } from 'node:zlib';
import { type NextRequest, NextResponse } from 'next/server';
import { resolveDashboardAuthResult } from '@/auth/api-auth';
import { openReplaySegmentStream } from '@/services/analytics/sessionReplays.service';

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

  const ndjson = await openReplaySegmentStream(result.context, sessionId);
  if (!ndjson) {
    return new NextResponse(null, { status: 404 });
  }

  // zlib with a sync flush per chunk, not CompressionStream: the latter buffers until end of input
  const gzip = /\bgzip\b/.test(request.headers.get('accept-encoding') ?? '');
  const body = gzip
    ? (Readable.toWeb(
        Readable.fromWeb(ndjson as unknown as NodeReadableStream<Uint8Array>).pipe(
          createGzip({ flush: constants.Z_SYNC_FLUSH }),
        ),
      ) as unknown as ReadableStream<Uint8Array>)
    : ndjson;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      ...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
      'Cache-Control': 'private, max-age=3600',
      'X-Accel-Buffering': 'no',
    },
  });
}
