import 'server-only';

import { getSessionReplays } from '@/repositories/clickhouse/index.repository';
import { getReplayStorageForSession } from '@/repositories/clickhouse/sessionReplays.repository';
import { readerFor } from '@/repositories/replaySegments.repository';
import { replayStorage } from '@/lib/env';
import type { ReplaySegmentManifest } from '@/entities/analytics/sessionReplays.entities';
import type { AuthContext } from '@/entities/auth/authContext.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getSessionReplaysForSite(siteQuery: BASiteQuery, limit: number, offset: number) {
  return getSessionReplays(siteQuery, limit, offset);
}

export async function getReplaySegmentManifest(
  authContext: AuthContext,
  sessionId: string,
): Promise<ReplaySegmentManifest> {
  const { siteId, dashboardId } = authContext;
  const segments = await readerFor(await resolveReplayStorage(siteId, sessionId)).list(siteId, sessionId);

  return segments.map((segment) => ({
    key: `site/${siteId}/sess/${sessionId}/${segment.filename}`,
    url: `/api/replay/segment?${new URLSearchParams({ dashboardId, sessionId, file: segment.filename })}`,
    sizeBytes: segment.sizeBytes,
  }));
}

export async function getReplaySegment(authContext: AuthContext, sessionId: string, filename: string) {
  const storage = await resolveReplayStorage(authContext.siteId, sessionId);
  return readerFor(storage).getSegment(authContext.siteId, sessionId, filename);
}

// A missing or unrecognized marker falls back to the deployment's active mode; in a
// ClickHouse-only deploy the S3 reader is unreachable that way (its client throws).
async function resolveReplayStorage(siteId: string, sessionId: string): Promise<'s3' | 'clickhouse'> {
  const marker = await getReplayStorageForSession(siteId, sessionId);
  return marker === 's3' || marker === 'clickhouse' ? marker : replayStorage;
}
