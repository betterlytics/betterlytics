import { type NextRequest, NextResponse } from 'next/server';
import { resolveDashboardAuthResult } from '@/auth/api-auth';
import { SNAPSHOT_SETTLE_MS } from '@/entities/analytics/clickHeatmap.entities';
import { openReplaySnapshotEvents } from '@/services/analytics/sessionReplays.service';

const SEGMENT_FILENAME = /^\d{13}-[A-Za-z0-9_-]{1,32}\.json$/;

// The replay events behind a heatmap background. Members only, like the segment stream;
// public views never get a replay layout.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const dashboardId = params.get('dashboardId');
  const sessionId = params.get('sessionId');
  const filename = params.get('filename');
  const snapshotMs = params.get('snapshotMs');
  if (
    !dashboardId ||
    !sessionId ||
    !/^\d+$/.test(sessionId) ||
    !filename ||
    !SEGMENT_FILENAME.test(filename) ||
    !snapshotMs ||
    !/^\d{1,15}$/.test(snapshotMs)
  ) {
    return new NextResponse(null, { status: 400 });
  }

  const result = await resolveDashboardAuthResult(dashboardId);
  if (result.error) {
    return new NextResponse(null, { status: result.error === 'unauthenticated' ? 401 : 403 });
  }
  if (result.context.isDemo) {
    return new NextResponse(null, { status: 404 });
  }

  const events = await openReplaySnapshotEvents(
    result.context,
    sessionId,
    filename,
    Number(snapshotMs) + SNAPSHOT_SETTLE_MS,
  );
  if (events === null) {
    return new NextResponse(null, { status: 404 });
  }

  // Stored segments never change; a day keeps a copy from outliving retention or revoked access
  return new NextResponse(events, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=86400, immutable',
    },
  });
}
