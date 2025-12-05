'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext';
import { SessionReplay, ReplaySegmentManifest } from '@/entities/analytics/sessionReplays';
import { type QueryFilter } from '@/entities/analytics/filter';
import { getReplaySegmentManifest, getSessionReplaysForSite } from '@/services/analytics/sessionReplays';

export const fetchSessionReplaysAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    limit: number,
    offset: number,
    queryFilters: QueryFilter[],
  ): Promise<SessionReplay[]> => {
    return getSessionReplaysForSite(ctx.siteId, startDate, endDate, queryFilters, limit, offset);
  },
);

type FetchReplaySegmentsPayload = {
  prefix: string;
  ttlSeconds?: number;
  cutoffIso?: Date;
};

export const fetchReplaySegmentsAction = withDashboardAuthContext(
  async (_ctx: AuthContext, payload: FetchReplaySegmentsPayload): Promise<ReplaySegmentManifest> => {
    if (!payload.prefix.includes(_ctx.siteId)) {
      throw new Error('Invalid prefix');
    }

    const ttlSeconds = 300;

    return getReplaySegmentManifest(payload.prefix, ttlSeconds, payload.cutoffIso);
  },
);
