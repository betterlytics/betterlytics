'server-only';

import {
  getOutboundLinksAnalytics,
  getDailyOutboundClicks,
  getOutboundLinksSummary,
  getOutboundLinksDistribution,
} from '@/repositories/clickhouse/outboundLinks.repository';
import {
  OutboundLinkRow,
  DailyOutboundClicksRow,
  OutboundLinksSummaryWithCharts,
  OutboundLinksSummaryWithChartsSchema,
  TopOutboundLinksDistrubution,
} from '@/entities/analytics/outboundLinks.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getOutboundLinksAnalyticsForSite(
  siteQuery: BASiteQuery,
  limit = 100,
): Promise<OutboundLinkRow[]> {
  return getOutboundLinksAnalytics(siteQuery, limit);
}

export async function getDailyOutboundClicksForSite(siteQuery: BASiteQuery): Promise<DailyOutboundClicksRow[]> {
  return getDailyOutboundClicks(siteQuery);
}

export async function getOutboundLinksSummaryWithChartsForSite(
  siteQuery: BASiteQuery,
): Promise<OutboundLinksSummaryWithCharts> {
  const [summary, dailyClicksChartData] = await Promise.all([
    getOutboundLinksSummary(siteQuery),
    getDailyOutboundClicks(siteQuery),
  ]);

  const summaryWithCharts = {
    totalClicks: summary.totalClicks,
    uniqueVisitors: summary.uniqueVisitors,
    topDomain: summary.topDomain,
    topSourceUrl: summary.topSourceUrl,
    dailyClicksChartData,
  };

  return OutboundLinksSummaryWithChartsSchema.parse(summaryWithCharts);
}

export async function getOutboundLinksDistributionForSite(
  siteQuery: BASiteQuery,
): Promise<Array<TopOutboundLinksDistrubution>> {
  return getOutboundLinksDistribution(siteQuery);
}
