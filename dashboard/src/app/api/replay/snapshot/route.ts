import { type NextRequest, NextResponse } from 'next/server';
import { resolveDashboardAuthResult } from '@/auth/api-auth';
import { openReplaySegment } from '@/services/analytics/sessionReplays.service';

const SEGMENT_FILENAME = /^\d{13}-[A-Za-z0-9_-]{1,32}\.json$/;

// One replay segment holding a full snapshot, the background of a heatmap. Members only, like
// the segment stream; public views never get a replay layout.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const dashboardId = params.get('dashboardId');
  const sessionId = params.get('sessionId');
  const filename = params.get('filename');
  if (!dashboardId || !sessionId || !/^\d+$/.test(sessionId) || !filename || !SEGMENT_FILENAME.test(filename)) {
    return new NextResponse(null, { status: 400 });
  }

  const result = await resolveDashboardAuthResult(dashboardId);
  if (result.error) {
    return new NextResponse(null, { status: result.error === 'unauthenticated' ? 401 : 403 });
  }
  if (result.context.isDemo) {
    return new NextResponse(null, { status: 404 });
  }

  const segment = await openReplaySegment(result.context, sessionId, filename);
  if (!segment) {
    return new NextResponse(null, { status: 404 });
  }

  // A stored segment never changes; a day keeps a copy from outliving retention or revoked access
  return new NextResponse(segment.body, {
    headers: {
      'Content-Type': 'application/json',
      ...(segment.contentEncoding ? { 'Content-Encoding': segment.contentEncoding } : {}),
      'Cache-Control': 'private, max-age=86400, immutable',
    },
  });
}
