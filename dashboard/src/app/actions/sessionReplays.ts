'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { SessionReplay, ReplaySegmentManifest } from '@/entities/sessionReplays';
import { getReplaySegmentManifest, getSessionReplaysForSite } from '@/services/sessionReplays';

export const fetchSessionReplaysAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date): Promise<SessionReplay[]> => {
    return getSessionReplaysForSite(ctx.siteId, startDate, endDate);
  },
);

type FetchReplaySegmentsPayload = {
  prefix: string;
  ttlSeconds?: number;
};

export const fetchReplaySegmentsAction = withDashboardAuthContext(
  async (_ctx: AuthContext, payload: FetchReplaySegmentsPayload): Promise<ReplaySegmentManifest> => {
    return getReplaySegmentManifest(payload.prefix, payload.ttlSeconds ?? 300);
  },
);
