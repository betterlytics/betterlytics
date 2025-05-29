"use server";

import { withDashboardAuthContext } from "@/auth/auth-actions";
import { getCustomEventsOverviewForSite, getEventPropertiesAnalyticsForSite, getRecentEventsForSite, getTotalEventCountForSite } from "@/services/events";
import { type AuthContext } from "@/entities/authContext";
import { QueryFilter } from "@/entities/filter";

export const fetchCustomEventsOverviewAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date, queryFilters: QueryFilter[]) => {
    return getCustomEventsOverviewForSite(ctx.siteId, startDate, endDate, queryFilters);
  }
);

export const fetchEventPropertiesAnalyticsAction = withDashboardAuthContext(
  async (ctx: AuthContext, eventName: string, startDate: Date, endDate: Date, queryFilters: QueryFilter[]) => {
    return getEventPropertiesAnalyticsForSite(ctx.siteId, eventName, startDate, endDate, queryFilters);
  }
);

export const fetchRecentEventsAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date, limit?: number, offset?: number, queryFilters?: QueryFilter[]) => {
    return getRecentEventsForSite(ctx.siteId, startDate, endDate, limit, offset, queryFilters);
  }
);

export const fetchTotalEventCountAction = withDashboardAuthContext(
  async (ctx: AuthContext, startDate: Date, endDate: Date, queryFilters: QueryFilter[]) => {
    return getTotalEventCountForSite(ctx.siteId, startDate, endDate, queryFilters);
  }
);
