'use server';

import { getUserJourneyForSankeyDiagram } from '@/services/analytics/userJourney.service';
import { SankeyData } from '@/entities/analytics/userJourney.entities';
import { z } from 'zod';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

const UserJourneyParamsSchema = z.object({
  maxSteps: z.number().int().min(1).max(5),
  limit: z.number().int().min(1).max(100),
});

export const fetchUserJourneyAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery): Promise<SankeyData> => {
    const { main } = toSiteQuery(ctx.siteId, query);

    const { maxSteps: validatedMaxSteps, limit: validatedLimit } = UserJourneyParamsSchema.parse({
      maxSteps: query.userJourney.numberOfSteps,
      limit: query.userJourney.numberOfJourneys,
    });

    return getUserJourneyForSankeyDiagram(main, validatedMaxSteps, validatedLimit);
  },
);
