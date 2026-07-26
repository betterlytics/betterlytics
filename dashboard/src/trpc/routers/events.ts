import { z } from 'zod';
import { createRouter, analyticsProcedure, dashboardProcedure } from '@/trpc/init';
import { EventLogCursorSchema } from '@/entities/analytics/events.entities';
import { MAX_FILTER_ROWS, QueryFilterSchema } from '@/entities/analytics/filter.entities';
import {
  getCustomEventsOverviewForSite,
  getEventPropertiesAnalyticsForSite,
  getNewEventsForSite,
  getRecentEventsForSite,
  getTotalEventCountForSite,
} from '@/services/analytics/events.service';
import { getGlobalPropertiesOverview } from '@/services/analytics/globalProperties.service';
import { toDataTable } from '@/presenters/toDataTable';
import { toGlobalPropertiesDataTable } from '@/presenters/toGlobalPropertiesDataTable';

const CUSTOM_EVENTS_OVERVIEW_LIMIT = 10;
const RECENT_EVENTS_DEFAULT_PAGE_SIZE = 25;
const RECENT_EVENTS_MAX_PAGE_SIZE = 100;
// The live poll may fetch a whole gap at once (up to a hidden-tab backlog), so
// its ceiling is deliberately higher than the page size.
const NEW_EVENTS_MAX_LIMIT = 500;

const GLOBAL_PROPERTIES_KEY_LIMIT = 10;
const GLOBAL_PROPERTIES_VALUE_LIMIT = 20;

const EventLogFiltersSchema = z.array(QueryFilterSchema).max(MAX_FILTER_ROWS);

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
          .default(RECENT_EVENTS_DEFAULT_PAGE_SIZE),
        cursor: EventLogCursorSchema.nullish(),
      }),
    )
    .query(({ ctx, input }) =>
      getRecentEventsForSite(ctx.authContext.siteId, input.queryFilters, input.limit, input.cursor ?? null),
    ),

  newEvents: dashboardProcedure
    .input(
      z.object({
        queryFilters: EventLogFiltersSchema,
        since: z.date(),
        limit: z.number().int().min(1).max(NEW_EVENTS_MAX_LIMIT).default(RECENT_EVENTS_DEFAULT_PAGE_SIZE),
      }),
    )
    .query(({ ctx, input }) =>
      getNewEventsForSite(ctx.authContext.siteId, input.queryFilters, input.since, input.limit),
    ),

  totalEventCount: dashboardProcedure
    .input(z.object({ queryFilters: EventLogFiltersSchema }))
    .query(({ ctx, input }) => getTotalEventCountForSite(ctx.authContext.siteId, input.queryFilters)),
});
