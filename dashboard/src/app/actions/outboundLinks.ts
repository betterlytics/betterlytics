'use server';

import {
  getOutboundLinksAnalyticsForSite,
  getDailyOutboundClicksForSite,
  getOutboundLinksSummaryWithChartsForSite,
} from '@/services/outboundLinks';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/filter';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/authContext';
import { toDataTable } from '@/presenters/toDataTable';

export const fetchOutboundLinksAnalyticsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    queryFilters: QueryFilter[],
    compareStartDate?: Date,
    compareEndDate?: Date,
  ) => {
    const data = await getOutboundLinksAnalyticsForSite(ctx.siteId, startDate, endDate, queryFilters);

    const compareData =
      compareStartDate &&
      compareEndDate &&
      (await getOutboundLinksAnalyticsForSite(ctx.siteId, compareStartDate, compareEndDate, queryFilters));

    return toDataTable({ data, compare: compareData, categoryKey: 'outbound_link_url' });
  },
);

export const fetchOutboundLinksSummaryWithChartsAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
  ) => {
    return getOutboundLinksSummaryWithChartsForSite(ctx.siteId, startDate, endDate, granularity, queryFilters);
  },
);

export const fetchDailyOutboundClicksAction = withDashboardAuthContext(
  async (
    ctx: AuthContext,
    startDate: Date,
    endDate: Date,
    granularity: GranularityRangeValues,
    queryFilters: QueryFilter[],
  ) => {
    return getDailyOutboundClicksForSite(ctx.siteId, startDate, endDate, granularity, queryFilters);
  },
);