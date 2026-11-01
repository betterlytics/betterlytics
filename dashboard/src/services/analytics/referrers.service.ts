'server-only';

import {
  getReferrerDistribution,
  getReferrerTableData,
  getReferrerTrafficTrendBySource,
  getReferrerUrlRollup,
  getTopChannels,
  getDailyReferralSummaryMetrics,
  getReferralRangeMetrics,
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

export async function getReferrerSummaryWithChartsForSite(
  siteQuery: BASiteQuery,
): Promise<ReferrerSummaryWithCharts> {
  const [rangeMetrics, dailyMetrics, topReferrerSource] = await Promise.all([
    getReferralRangeMetrics(siteQuery),
    getDailyReferralSummaryMetrics(siteQuery),
    getTopReferrerSource(siteQuery),
  ]);

  const result = {
    ...rangeMetrics,
    topReferrerSource,
    referralSessionsChartData: dailyMetrics.map(({ date, referralSessions }) => ({ date, referralSessions })),
    referralPercentageChartData: dailyMetrics.map(({ date, referralPercentage }) => ({
      date,
      referralPercentage,
    })),
    avgSessionDurationChartData: dailyMetrics.map(({ date, avgSessionDuration }) => ({
      date,
      avgSessionDuration,
    })),
  };

  return ReferrerSummaryWithChartsSchema.parse(result);
}
