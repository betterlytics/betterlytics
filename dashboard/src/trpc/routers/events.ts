import { z } from 'zod';
import { createRouter, analyticsProcedure } from '@/trpc/init';
import {
  getCustomEventsOverviewForSite,
  getEventPropertiesAnalyticsForSite,
  getRecentEventsForSite,
  getTotalEventCountForSite,
} from '@/services/analytics/events.service';
import { toDataTable } from '@/presenters/toDataTable';

export const eventsRouter = createRouter({
  customEventsOverview: analyticsProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ ctx, input }) => {
      const { main, compare } = ctx;
      const [data, compareData] = await Promise.all([
        getCustomEventsOverviewForSite(main),
        compare && getCustomEventsOverviewForSite(compare),
      ]);
      return toDataTable({ data, compare: compareData, categoryKey: 'event_name' }).slice(0, input.limit);
    }),

  eventPropertiesAnalytics: analyticsProcedure
    .input(z.object({ eventName: z.string() }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      return getEventPropertiesAnalyticsForSite(main, input.eventName);
    }),

  recentEvents: analyticsProcedure
    .input(z.object({
      limit: z.number().optional().default(25),
      cursor: z.number().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      return getRecentEventsForSite(main, input.limit, input.cursor ?? 0);
    }),

  totalEventCount: analyticsProcedure.query(async ({ ctx }) => {
    const { main } = ctx;
    return getTotalEventCountForSite(main);
  }),
});
