import { z } from 'zod';
import { createRouter, analyticsProcedure, dashboardProcedure } from '@/trpc/init';
import {
  getCustomEventsOverviewForSite,
  getEventPropertiesAnalyticsForSite,
  getRecentEventsForSite,
  getTotalEventCountForSite,
} from '@/services/analytics/events.service';
import { getGlobalPropertiesOverview } from '@/services/analytics/globalProperties.service';
import { toDataTable } from '@/presenters/toDataTable';
import { toGlobalPropertiesDataTable } from '@/presenters/toGlobalPropertiesDataTable';
import { MAX_FILTER_ROWS, QueryFilterSchema } from '@/entities/analytics/filter.entities';

const CUSTOM_EVENTS_OVERVIEW_LIMIT = 10;
const RECENT_EVENTS_DEFAULT_PAGE_SIZE = 25;
const RECENT_EVENTS_MAX_PAGE_SIZE = 100;

const EventLogFiltersSchema = z.array(QueryFilterSchema).max(MAX_FILTER_ROWS);

const GLOBAL_PROPERTIES_KEY_LIMIT = 10;
const GLOBAL_PROPERTIES_VALUE_LIMIT = 20;

export const eventsRouter = createRouter({
  customEventsOverview: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getCustomEventsOverviewForSite(main, CUSTOM_EVENTS_OVERVIEW_LIMIT),
      compare && getCustomEventsOverviewForSite(compare, CUSTOM_EVENTS_OVERVIEW_LIMIT),
    ]);
    return toDataTable({ data, compare: compareData, categoryKey: 'event_name' });
  }),

  globalPropertiesOverview: analyticsProcedure.query(async ({ ctx }) => {
    const { main, compare } = ctx;
    const [data, compareData] = await Promise.all([
      getGlobalPropertiesOverview(main, GLOBAL_PROPERTIES_KEY_LIMIT, GLOBAL_PROPERTIES_VALUE_LIMIT),
      compare
        ? getGlobalPropertiesOverview(compare, GLOBAL_PROPERTIES_KEY_LIMIT, GLOBAL_PROPERTIES_VALUE_LIMIT)
        : null,
    ]);
    return toGlobalPropertiesDataTable({ data, compare: compareData });
  }),

  eventPropertiesAnalytics: analyticsProcedure
    .input(z.object({ eventName: z.string() }))
    .query(async ({ ctx, input }) => {
      const { main } = ctx;
      return getEventPropertiesAnalyticsForSite(main, input.eventName);
    }),

  recentEvents: dashboardProcedure
    .input(
      z.object({
        queryFilters: EventLogFiltersSchema,
        limit: z
          .number()
          .int()
          .min(1)
          .max(RECENT_EVENTS_MAX_PAGE_SIZE)
          .optional()
          .default(RECENT_EVENTS_DEFAULT_PAGE_SIZE),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getRecentEventsForSite(
        ctx.authContext.siteId,
        input.queryFilters,
        input.limit,
        input.cursor ?? 0,
      );
    }),

  totalEventCount: dashboardProcedure
    .input(z.object({ queryFilters: EventLogFiltersSchema }))
    .query(async ({ ctx, input }) => {
      return getTotalEventCountForSite(ctx.authContext.siteId, input.queryFilters);
    }),
});
