'use server';

import { getUserJourneyForSankeyDiagram } from '@/services/analytics/userJourney.service';
import { SankeyData } from '@/entities/analytics/userJourney.entities';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { z } from 'zod';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';

const UserJourneyParamsSchema = z.object({
  maxSteps: z.number().int().min(1).max(5),
  limit: z.number().int().min(1).max(100),
});

/**
 * Fetch user journey data for Sankey diagram visualization
 *
 * This returns complete user journeys grouped by frequency,
 * showing the exact paths users take through a site.
 * maxSteps counts transitions (hops). e.g., maxSteps=2 shows A -> B -> C.
 */
export const fetchUserJourneyAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    maxSteps: number = 3,
    limit: number = 50,
    queryFilters: QueryFilter[],
  ): Promise<SankeyData> => {
    const { maxSteps: validatedMaxSteps, limit: validatedLimit } = UserJourneyParamsSchema.parse({
      maxSteps,
      limit,
    });

    return getUserJourneyForSankeyDiagram(
      ctx.siteId,
      startDate,
      endDate,
      validatedMaxSteps,
      validatedLimit,
      queryFilters,
    );
  },
);
