import { z } from 'zod';
import { analyticsProcedure, createRouter } from '@/trpc/init';
import { FilterColumnSchema, MAX_FILTER_ROWS, ScopeFilterSchema } from '@/entities/analytics/filter.entities';
import { USER_JOURNEY_MAX_STEPS } from '@/entities/analytics/analyticsQuery.entities';
import { getJourneyStepFilterOptions, getUserJourneyForSankeyDiagram } from '@/services/analytics/userJourney.service';

export const userJourneyRouter = createRouter({
  journey: analyticsProcedure.query(async ({ ctx }) => {
    return getUserJourneyForSankeyDiagram(ctx.main, ctx.main.userJourney.numberOfJourneys);
  }),
  stepFilterOptions: analyticsProcedure
    .input(
      z.object({
        column: FilterColumnSchema,
        search: z.string().trim().max(128).optional(),
        limit: z.number().int().min(1).max(5000).optional().default(200),
        slot: z.number().int().min(0).max(USER_JOURNEY_MAX_STEPS - 1),
        stepFilters: z.record(z.string(), ScopeFilterSchema.array().max(MAX_FILTER_ROWS)),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getJourneyStepFilterOptions(ctx.main, input);
    }),
});
