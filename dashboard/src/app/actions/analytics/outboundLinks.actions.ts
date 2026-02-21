'use server';

import {
  getOutboundLinksAnalyticsForSite,
  getDailyOutboundClicksForSite,
  getOutboundLinksSummaryWithChartsForSite,
  getOutboundLinksDistributionForSite,
} from '@/services/analytics/outboundLinks.service';
import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { toDataTable } from '@/presenters/toDataTable';
import { toAreaChart } from '@/presenters/toAreaChart';
import { toPieChart } from '@/presenters/toPieChart';
import { isEndBucketIncomplete, isStartBucketIncomplete } from '@/lib/ba-timerange';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toSiteQuery } from '@/lib/toSiteQuery';

export const fetchOutboundLinksAnalyticsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getOutboundLinksAnalyticsForSite(main);
    const compareData = compare && (await getOutboundLinksAnalyticsForSite(compare));

    return toDataTable({ data, compare: compareData, categoryKey: 'outbound_link_url' });
  },
);

export const fetchOutboundLinksSummaryWithChartsAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    return getOutboundLinksSummaryWithChartsForSite(main);
  },
);

export const fetchDailyOutboundClicksAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main } = toSiteQuery(ctx.siteId, query);
    return getDailyOutboundClicksForSite(main);
  },
);

export const fetchOutboundClicksChartAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getDailyOutboundClicksForSite(main);
    const compareData = compare && (await getDailyOutboundClicksForSite(compare));

    return toAreaChart({
      dataKey: 'outboundClicks',
      data,
      compare: compareData,
      granularity: main.granularity,
      dateRange: { start: main.startDate, end: main.endDate },
      compareDateRange: compare ? { start: compare.startDate, end: compare.endDate } : undefined,
      bucketIncomplete:
        main.endDate.getTime() > Date.now() ||
        isEndBucketIncomplete(main.endDate, main.granularity, main.timezone),
      startBucketIncomplete: isStartBucketIncomplete(main.startDate, main.granularity, main.timezone),
    });
  },
);

export const fetchOutboundLinksDistributionAction = withDashboardAuthContext(
  async (ctx: AuthContext, query: BAAnalyticsQuery) => {
    const { main, compare } = toSiteQuery(ctx.siteId, query);

    const data = await getOutboundLinksDistributionForSite(main);
    const compareData = compare && (await getOutboundLinksDistributionForSite(compare));

    return toPieChart({
      key: 'outbound_link_url',
      dataKey: 'clicks',
      data,
      compare: compareData,
    });
  },
);
