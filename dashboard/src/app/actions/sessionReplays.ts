'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { SessionReplay } from '@/entities/sessionReplays';
import { getSessionReplaysForSite, getSignedReplaySegments } from '@/services/sessionReplays';

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
  async (_ctx: AuthContext, payload: FetchReplaySegmentsPayload) => {
    return getSignedReplaySegments(payload.prefix, payload.ttlSeconds ?? 60);
  },
);
