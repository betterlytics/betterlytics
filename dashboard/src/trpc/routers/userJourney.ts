import { analyticsProcedure, createRouter } from '@/trpc/init';
import { getUserJourneyForSankeyDiagram } from '@/services/analytics/userJourney.service';

export const userJourneyRouter = createRouter({
  journey: analyticsProcedure.query(async ({ ctx }) => {
    return getUserJourneyForSankeyDiagram(
      ctx.main,
      ctx.main.userJourney.numberOfSteps,
      ctx.main.userJourney.numberOfJourneys,
    );
  }),
});
