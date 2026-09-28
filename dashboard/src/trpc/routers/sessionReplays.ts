import { z } from 'zod';
import { createRouter, dashboardProcedure } from '@/trpc/init';
import { BAAnalyticsQuerySchema } from '@/entities/analytics/analyticsQuery.entities';
import { SESSION_REPLAY_ACTIVITY_MAX_IDS } from '@/entities/analytics/sessionReplays.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import {
  getSessionReplayActivityForSite,
  getSessionReplaysForSite,
} from '@/services/analytics/sessionReplays.service';

const queryInput = z.object({ query: BAAnalyticsQuerySchema });

const SESSION_REPLAYS_DEFAULT_PAGE_SIZE = 20;
const SESSION_REPLAYS_MAX_PAGE_SIZE = 100;

export const sessionReplaysRouter = createRouter({
  list: dashboardProcedure
    .input(queryInput.extend({
      limit: z.number().int().min(1).max(SESSION_REPLAYS_MAX_PAGE_SIZE).default(SESSION_REPLAYS_DEFAULT_PAGE_SIZE),
      cursor: z.number().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const { main } = toSiteQuery(ctx.authContext.siteId, input.query);
      return getSessionReplaysForSite(main, input.limit, input.cursor ?? 0);
    }),
  activity: dashboardProcedure
    .input(z.object({
      sessionIds: z.array(z.string().regex(/^\d+$/)).min(1).max(SESSION_REPLAY_ACTIVITY_MAX_IDS),
    }))
    .query(async ({ ctx, input }) => {
      return getSessionReplayActivityForSite(ctx.authContext.siteId, input.sessionIds);
    }),
});
