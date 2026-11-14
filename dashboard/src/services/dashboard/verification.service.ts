'server-only';

import { getLastEventAt } from '@/repositories/clickhouse/verification.repository';
import { TRACKING_SILENCE_HOURS, type TrackingStatus } from '@/entities/dashboard/verification.entities';

const RECENT_EVENT_WINDOW_MS = TRACKING_SILENCE_HOURS * 60 * 60 * 1000;

export async function getTrackingStatus(siteId: string): Promise<TrackingStatus> {
  const lastEventAt = await getLastEventAt(siteId);
  const isReceiving = lastEventAt !== null && Date.now() - lastEventAt.getTime() < RECENT_EVENT_WINDOW_MS;
  return { isReceiving, lastEventAt };
}
