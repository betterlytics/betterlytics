import { createRouter } from '@/trpc/init';
import { overviewRouter } from '@/trpc/routers/overview';
import { geographyRouter } from '@/trpc/routers/geography';
import { devicesRouter } from '@/trpc/routers/devices';
import { referrersRouter } from '@/trpc/routers/referrers';
import { eventsRouter } from '@/trpc/routers/events';
import { weeklyHeatmapRouter } from '@/trpc/routers/weeklyHeatmap';
import { pagesRouter } from '@/trpc/routers/pages';
import { campaignRouter } from '@/trpc/routers/campaign';
import { outboundLinksRouter } from '@/trpc/routers/outboundLinks';
import { webVitalsRouter } from '@/trpc/routers/webVitals';
import { errorsRouter } from '@/trpc/routers/errors';
import { funnelsRouter } from '@/trpc/routers/funnels';
import { sessionReplaysRouter } from '@/trpc/routers/sessionReplays';
import { userJourneyRouter } from '@/trpc/routers/userJourney';
import { visitorsRouter } from '@/trpc/routers/visitors';
import { filtersRouter } from '@/trpc/routers/filters';
import { savedFiltersRouter } from '@/trpc/routers/savedFilters';

export const appRouter = createRouter({
  overview: overviewRouter,
  geography: geographyRouter,
  devices: devicesRouter,
  referrers: referrersRouter,
  events: eventsRouter,
  weeklyHeatmap: weeklyHeatmapRouter,
  pages: pagesRouter,
  campaign: campaignRouter,
  outboundLinks: outboundLinksRouter,
  webVitals: webVitalsRouter,
  errors: errorsRouter,
  funnels: funnelsRouter,
  sessionReplays: sessionReplaysRouter,
  userJourney: userJourneyRouter,
  visitors: visitorsRouter,
  filters: filtersRouter,
  savedFilters: savedFiltersRouter,
});

export type AppRouter = typeof appRouter;
