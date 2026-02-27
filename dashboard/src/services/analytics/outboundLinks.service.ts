'server-only';

import {
  getOutboundLinksAnalytics,
  getDailyOutboundClicks,
  getOutboundLinksDistribution,
} from '@/repositories/clickhouse/outboundLinks.repository';
import {
  OutboundLinkRow,
  DailyOutboundClicksRow,
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

export async function getOutboundLinksDistributionForSite(
  siteQuery: BASiteQuery,
): Promise<Array<TopOutboundLinksDistrubution>> {
  return getOutboundLinksDistribution(siteQuery);
}
