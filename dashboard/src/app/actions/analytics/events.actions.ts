'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import {
  getCustomEventsOverviewForSite,
  getEventPropertiesAnalyticsForSite,
  getRecentEventsForSite,
  getTotalEventCountForSite,
} from '@/services/analytics/events.service';
import { type AuthContext } from '@/entities/auth/authContext.entities';
import { toDataTable } from '@/presenters/toDataTable';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export const fetchCustomEventsOverviewAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getCustomEventsOverviewForSite(main);
    const compareData = compare && (await getCustomEventsOverviewForSite(compare));

    return toDataTable({
      data,
      compare: compareData,
      categoryKey: 'event_name',
    }).slice(0, 10);
  },
);

export const fetchEventPropertiesAnalyticsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, eventName: string) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    return getEventPropertiesAnalyticsForSite(main, eventName);
  },
);

export const fetchRecentEventsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery, limit?: number, offset?: number) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    return getRecentEventsForSite(main, limit, offset);
  },
);

export const fetchTotalEventCountAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    return getTotalEventCountForSite(main);
  },
);
