'use server';

import { getUserJourneyForSankeyDiagram } from '@/services/analytics/userJourney';
import { SankeyData } from '@/entities/userJourney';
import { QueryFilter } from '@/entities/filter';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';

/**
 * Fetch user journey data for Sankey diagram visualization
 *
 * This returns complete user journeys grouped by frequency,
 * showing the exact paths users take through a site.
 * maxSteps is the number of steps in the journey (e.g., maxSteps=3 shows A→B→C)
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
    return getUserJourneyForSankeyDiagram(ctx.siteId, startDate, endDate, maxSteps, limit, queryFilters);
  },
);
