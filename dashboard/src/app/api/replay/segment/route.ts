import { type NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getCachedSession, getCachedAuthorizedContext, resolveDemoDashboardContext } from '@/auth/api-auth';
import { getReplaySegment } from '@/services/analytics/sessionReplays.service';
import type { AuthContext } from '@/entities/auth/authContext.entities';

const SEGMENT_FILENAME_PATTERN = /^\d{13}-[\w-]{6}\.json$/;

// Auth mirrors resolveDashboardAuth in trpc/init.ts, demo branch included: the demo
// dashboard's segments are intentionally reachable without a session, like every demo query.
async function resolveAuthContext(dashboardId: string): Promise<AuthContext | null> {
  if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) {
    return resolveDemoDashboardContext(dashboardId);
  }

  const session = await getCachedSession();
  if (!session?.user) {
    return null;
  }
  return getCachedAuthorizedContext(session.user.id, dashboardId);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const dashboardId = params.get('dashboardId');
  const sessionId = params.get('sessionId');
  const file = params.get('file');

  if (!dashboardId || !sessionId || !/^\d+$/.test(sessionId) || !file || !SEGMENT_FILENAME_PATTERN.test(file)) {
    return new NextResponse(null, { status: 400 });
  }

  const authContext = await resolveAuthContext(dashboardId);
  if (!authContext) {
    return new NextResponse(null, { status: 401 });
  }

  const segment = await getReplaySegment(authContext, sessionId, file);
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
