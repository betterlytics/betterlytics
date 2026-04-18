import { z } from 'zod';
import { createRouter, dashboardProcedure } from '@/trpc/init';
import { BAAnalyticsQuerySchema } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import { getSessionReplaysForSite, getReplaySegmentManifest } from '@/services/analytics/sessionReplays.service';
import { TRPCError } from '@trpc/server';

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

  segments: dashboardProcedure
    .input(z.object({ prefix: z.string(), cutoffIso: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.prefix.includes(ctx.authContext.siteId)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid prefix' });
      }
      return getReplaySegmentManifest(input.prefix, 300, input.cutoffIso);
    }),
});
