'server-only';

import {
  getOutboundLinksAnalytics,
  getDailyOutboundClicks,
  getOutboundLinksDistribution,
} from '@/repositories/clickhouse/outboundLinks.repository';
import { toDateTimeString } from '@/utils/dateFormatters';
import {
  OutboundLinkRow,
  DailyOutboundClicksRow,
  TopOutboundLinksDistrubution,
} from '@/entities/analytics/outboundLinks.entities';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/analytics/filter.entities';

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
