import { type NextRequest, NextResponse } from 'next/server';
import { resolveDashboardAuthResult } from '@/auth/api-auth';
import { getReplaySegment } from '@/services/analytics/sessionReplays.service';

const SEGMENT_FILENAME_PATTERN = /^\d{13}-[\w-]{1,40}\.json$/;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const dashboardId = params.get('dashboardId');
  const sessionId = params.get('sessionId');
  const file = params.get('file');

  if (!dashboardId || !sessionId || !/^\d+$/.test(sessionId) || !file || !SEGMENT_FILENAME_PATTERN.test(file)) {
    return new NextResponse(null, { status: 400 });
  }

  const result = await resolveDashboardAuthResult(dashboardId);
  if (result.error) {
    return new NextResponse(null, { status: result.error === 'unauthenticated' ? 401 : 403 });
  }

  const segment = await getReplaySegment(result.context, sessionId, file);
  if (!segment) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(segment.body, {
    headers: {
      'Content-Type': 'application/json',
      // The s3 reader hands back the stored gzip bytes; the browser decompresses natively
      ...(segment.contentEncoding ? { 'Content-Encoding': segment.contentEncoding } : {}),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
