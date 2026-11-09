'server-only';

import {
  getReferrerDistribution,
  getReferrerTableData,
  getReferrerTrafficTrendBySource,
  getReferrerUrlRollup,
  getTopChannels,
  getSessionMetrics,
  getSessionRangeMetrics,
  getTopReferrerSource,
} from '@/repositories/clickhouse/index.repository';
import {
  ReferrerSourceAggregation,
  ReferrerSummaryWithCharts,
  ReferrerSummaryWithChartsSchema,
  ReferrerTableRow,
  ReferrerTableRowSchema,
  ReferrerTrafficBySourceRow,
  ReferrerUrlRollupRow,
  TopChannel,
} from '@/entities/analytics/referrers.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { QueryFilter } from '@/entities/analytics/filter.entities';

export async function getReferrerSourceAggregationDataForSite(
  siteQuery: BASiteQuery,
): Promise<ReferrerSourceAggregation[]> {
  return getReferrerDistribution(siteQuery);
}

export async function getReferrerTrafficTrendBySourceDataForSite(
  siteQuery: BASiteQuery,
): Promise<ReferrerTrafficBySourceRow[]> {
  return getReferrerTrafficTrendBySource(siteQuery);
}

export async function getReferrerTableDataForSite(
  siteQuery: BASiteQuery,
  limit = 100,
): Promise<ReferrerTableRow[]> {
  const result = await getReferrerTableData(siteQuery, limit);
  return result.map((row) => ReferrerTableRowSchema.parse(row));
}

export async function getReferrerUrlRollupForSite(
  siteQuery: BASiteQuery,
  limit = 10,
): Promise<ReferrerUrlRollupRow[]> {
  return getReferrerUrlRollup(siteQuery, limit);
}

export async function getTopChannelsForSite(siteQuery: BASiteQuery, limit = 10): Promise<TopChannel[]> {
  return getTopChannels(siteQuery, limit);
}

const REFERRAL_SESSIONS_FILTER: QueryFilter = {
  id: 'referral-sessions',
  column: 'referrer_source',
  operator: '!=',
  values: ['direct', 'internal'],
};

/**
 * The Overview's session metrics, once as they are and once limited to referral sessions,
 * so the referral KPIs cannot drift from the Overview's definitions.
 */
export async function getReferrerSummaryWithChartsForSite(
  siteQuery: BASiteQuery,
): Promise<ReferrerSummaryWithCharts> {
  const referralQuery: BASiteQuery = {
    ...siteQuery,
    queryFilters: [...siteQuery.queryFilters, REFERRAL_SESSIONS_FILTER],
  };

  const [allRange, referralRange, allBuckets, referralBuckets, topReferrerSource] = await Promise.all([
    getSessionRangeMetrics(siteQuery),
    getSessionRangeMetrics(referralQuery),
    getSessionMetrics(siteQuery),
    getSessionMetrics(referralQuery),
    getTopReferrerSource(siteQuery),
  ]);

  const allSessionsByDate = new Map(allBuckets.map((bucket) => [bucket.date, bucket.sessions]));
  const chartData = referralBuckets.map((bucket) => {
    const allSessions = allSessionsByDate.get(bucket.date) ?? 0;
    return {
      date: bucket.date,
      referralSessions: bucket.sessions,
      referralPercentage: allSessions > 0 ? Math.round((1000 * bucket.sessions) / allSessions) / 10 : 0,
      avgSessionDuration: bucket.avg_visit_duration,
    };
  });

  return ReferrerSummaryWithChartsSchema.parse({
    referralSessions: referralRange.sessions,
    totalSessions: allRange.sessions,
    avgSessionDuration: referralRange.avg_visit_duration,
    topReferrerSource,
    chartData,
  });
}
