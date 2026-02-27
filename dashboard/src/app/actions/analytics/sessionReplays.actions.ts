'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { SessionReplay, ReplaySegmentManifest } from '@/entities/analytics/sessionReplays.entities';
import { getReplaySegmentManifest, getSessionReplaysForSite } from '@/services/analytics/sessionReplays.service';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export const fetchSessionReplaysAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, limit: number, offset: number): Promise<SessionReplay[]> => {
    const { main } = toSiteQuery(ctx.siteId, query);
    return getSessionReplaysForSite(main, limit, offset);
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
