import { z } from 'zod';
import { createRouter, dashboardProcedure } from '@/trpc/init';
import { BAAnalyticsQuerySchema } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';
import { getUserJourneyForSankeyDiagram } from '@/services/analytics/userJourney.service';

const queryInput = z.object({ query: BAAnalyticsQuerySchema });

const UserJourneyParamsSchema = z.object({
  maxSteps: z.number().int().min(1).max(5),
  limit: z.number().int().min(1).max(100),
});

export const userJourneyRouter = createRouter({
  journey: dashboardProcedure.input(queryInput).query(async ({ ctx, input }) => {
    const { main } = toSiteQuery(ctx.authContext.siteId, input.query);
    const { maxSteps, limit } = UserJourneyParamsSchema.parse({
      maxSteps: input.query.userJourney.numberOfSteps,
      limit: input.query.userJourney.numberOfJourneys,
    });
    return getUserJourneyForSankeyDiagram(main, maxSteps, limit);
  }),
});
