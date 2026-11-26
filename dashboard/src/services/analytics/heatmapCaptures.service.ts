import 'server-only';

import { createHash, randomBytes } from 'crypto';
import { getTranslations } from 'next-intl/server';
import type { AuthContext } from '@/entities/auth/authContext.entities';
import type {
  CreateHeatmapCaptureLinkInput,
  HeatmapCapture,
  HeatmapCaptureFilter,
} from '@/entities/analytics/heatmapCaptures.entities';
import { replayStorage, s3Env } from '@/lib/env';
import { UserException } from '@/lib/exceptions';
import {
  createHeatmapCaptureLink,
  deleteHeatmapCaptureRow,
  findHeatmapCaptureLocation,
  findHeatmapCaptures,
} from '@/repositories/postgres/heatmapCaptures.repository';
import { captureSnapshotStoreFor } from '@/repositories/heatmapCaptureSnapshots.repository';
import { isPublicDashboardId } from '@/services/auth/auth.service';

export class HeatmapCapturesForbiddenError extends Error {}

// Public views (share links, the demo for non-members) never see captures: a snapshot is a
// copy of a page as an editor saw it, possibly signed in.
function assertMemberContext(ctx: AuthContext): void {
  if (ctx.isDemo) {
    throw new HeatmapCapturesForbiddenError('Heatmap captures are only available to dashboard members');
  }
}

function hashCaptureToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// The token travels in the capture page's URL fragment; only its hash is stored. It names the
// dashboard's site, so only pages running this dashboard's tracking script take it up, on any
// host: the editor may walk to the page from another one, or capture a staging copy.
// The public demo dashboard takes no captures, also not from its members.
export async function createCaptureLink(ctx: AuthContext, input: CreateHeatmapCaptureLinkInput) {
  if (isPublicDashboardId(ctx.dashboardId)) {
    throw new HeatmapCapturesForbiddenError('The public demo dashboard takes no heatmap captures');
  }
  if (replayStorage === 's3' && (!s3Env.enabled || !s3Env.bucket)) {
    const t = await getTranslations('validation.heatmapCaptures');
    throw new UserException(t('storageNotConfigured'));
  }

  const token = `bhc_${ctx.siteId}.${randomBytes(32).toString('base64url')}`;
  const { expiresAt } = await createHeatmapCaptureLink(
    ctx.dashboardId,
    ctx.userId,
    { path: input.path, device: input.device },
    hashCaptureToken(token),
  );
  return { token, expiresAt };
}

export async function listCaptures(ctx: AuthContext, filter: HeatmapCaptureFilter): Promise<HeatmapCapture[]> {
  assertMemberContext(ctx);
  return await findHeatmapCaptures(ctx.dashboardId, filter);
}

export async function openCaptureSnapshot(ctx: AuthContext, captureId: string) {
  assertMemberContext(ctx);
  const location = await findHeatmapCaptureLocation(ctx.dashboardId, captureId);
  if (!location) return null;
  return await captureSnapshotStoreFor(location.storage).get(ctx.siteId, location.storageKey);
}

// The snapshot goes first: if that fails the row stays, so the capture is still listed and
// can be deleted again instead of leaving an unlisted copy behind.
export async function deleteCapture(ctx: AuthContext, captureId: string): Promise<void> {
  const location = await findHeatmapCaptureLocation(ctx.dashboardId, captureId);
  if (!location) return;
  await captureSnapshotStoreFor(location.storage).delete(ctx.siteId, location.storageKey);
  await deleteHeatmapCaptureRow(ctx.dashboardId, captureId);
}
