'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import {
  getCustomEventsOverviewForSite,
  getEventPropertiesAnalyticsForSite,
  getRecentEventsForSite,
  getRecentEventsForSiteCursor,
  getTotalEventCountForSite,
} from '@/services/analytics/events.service';
import { type AuthContext } from '@/entities/auth/authContext.entities';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { toDataTable } from '@/presenters/toDataTable';
import type { EventLogEntry } from '@/entities/analytics/events.entities';
import type { CursorPaginatedResult } from '@/entities/pagination.entities';

export const fetchCustomEventsOverviewAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getCustomEventsOverviewForSite(ctx.siteId, startDate, endDate, queryFilters);
    const compare =
      compareStartDate &&
      compareEndDate &&
      (await getCustomEventsOverviewForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters));

    return toDataTable({
      data,
      compare,
      categoryKey: 'event_name',
    }).slice(0, 10);
  },
);

export const fetchEventPropertiesAnalyticsAction = withDashboardAuthContext(
  async (ctx: AuthContext, eventName: string, startDate: Date, endDate: Date, queryFilters: QueryFilter[]) => {
    return getEventPropertiesAnalyticsForSite(ctx.siteId, eventName, startDate, endDate, queryFilters);
  },
);

export const fetchRecentEventsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    limit?: number,
    offset?: number,
    queryFilters?: QueryFilter[],
  ) => {
    return getRecentEventsForSite(ctx.siteId, startDate, endDate, limit, offset, queryFilters);
  },
);

/**
 * Server action for cursor-based event log pagination.
 */
export const fetchRecentEventsCursorAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    cursor: string | null,
    limit: number,
    queryFilters?: QueryFilter[],
  ): Promise<CursorPaginatedResult<EventLogEntry>> => {
    return getRecentEventsForSiteCursor(ctx.siteId, startDate, endDate, cursor, limit, queryFilters);
  },
);

export const fetchTotalEventCountAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date, queryFilters: QueryFilter[]) => {
    return getTotalEventCountForSite(ctx.siteId, startDate, endDate, queryFilters);
  },
);
