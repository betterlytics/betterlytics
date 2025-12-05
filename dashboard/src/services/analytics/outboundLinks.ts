'server-only';

import {
  getOutboundLinksAnalytics,
  getDailyOutboundClicks,
  getOutboundLinksSummary,
  getOutboundLinksDistribution,
} from '@/repositories/clickhouse/outboundLinks';
import { toDateTimeString } from '@/utils/dateFormatters';
import {
  OutboundLinkRow,
  DailyOutboundClicksRow,
  OutboundLinksSummaryWithCharts,
  OutboundLinksSummaryWithChartsSchema,
  TopOutboundLinksDistrubution,
} from '@/entities/analytics/outboundLinks';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/analytics/filter';

export async function getOutboundLinksAnalyticsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
  limit = 100,
): Promise<OutboundLinkRow[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getOutboundLinksAnalytics(siteId, formattedStart, formattedEnd, queryFilters, limit);
}

export async function getDailyOutboundClicksForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<DailyOutboundClicksRow[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getDailyOutboundClicks(siteId, formattedStart, formattedEnd, granularity, queryFilters, timezone);
}

export async function getOutboundLinksSummaryWithChartsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<OutboundLinksSummaryWithCharts> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  const [summary, dailyClicksChartData] = await Promise.all([
    getOutboundLinksSummary(siteId, formattedStart, formattedEnd, queryFilters),
    getDailyOutboundClicks(siteId, formattedStart, formattedEnd, granularity, queryFilters, timezone),
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
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
): Promise<Array<TopOutboundLinksDistrubution>> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getOutboundLinksDistribution(siteId, formattedStart, formattedEnd, queryFilters);
}
