import { type NextRequest, NextResponse } from 'next/server';
import { resolveDashboardAuthResult } from '@/auth/api-auth';
import { HeatmapCapturesForbiddenError, openCaptureSnapshot } from '@/services/analytics/heatmapCaptures.service';

// Loads one capture's rrweb events (JSON array) for any member of the dashboard
export async function GET(request: NextRequest, { params }: { params: Promise<{ captureId: string }> }) {
  const { captureId } = await params;
  const dashboardId = request.nextUrl.searchParams.get('dashboardId');
  if (!dashboardId || !captureId) {
    return new NextResponse(null, { status: 400 });
  }

  const result = await resolveDashboardAuthResult(dashboardId);
  if (result.error) {
    return new NextResponse(null, { status: result.error === 'unauthenticated' ? 401 : 403 });
  }

  let snapshot;
  try {
    snapshot = await openCaptureSnapshot(result.context, captureId);
  } catch (error) {
    if (error instanceof HeatmapCapturesForbiddenError) return new NextResponse(null, { status: 403 });
    throw error;
  }
  if (!snapshot) {
    return new NextResponse(null, { status: 404 });
  }

  // Gzip is the payload, not a Content-Encoding: Next 15.5.29+ drops a route's own Content-Encoding,
  // so the panel inflates the body. No caching: a deleted capture must stop loading at once.
  return new NextResponse(snapshot.body, {
    headers: {
      'Content-Type': snapshot.contentEncoding === 'gzip' ? 'application/gzip' : 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}
