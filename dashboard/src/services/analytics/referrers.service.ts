'server-only';

import {
  getReferrerDistribution,
  getReferrerTableData,
  getReferrerTrafficTrendBySource,
  getTopReferrerUrls,
  getTopChannels,
  getTopReferrerSources,
  getDailyReferralSessions,
  getDailyReferralTrafficPercentage,
  getDailyReferralSessionDuration,
  getTopReferrerSource,
} from '@/repositories/clickhouse/index.repository';
import {
  ReferrerSourceAggregation,
  ReferrerSummaryWithCharts,
  ReferrerSummaryWithChartsSchema,
  ReferrerTableRow,
  ReferrerTableRowSchema,
  ReferrerTrafficBySourceRow,
  TopReferrerUrl,
  TopChannel,
  TopReferrerSource,
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

export async function getTopReferrerUrlsForSite(siteQuery: BASiteQuery, limit = 10): Promise<TopReferrerUrl[]> {
  return getTopReferrerUrls(siteQuery, limit);
}

export async function getTopChannelsForSite(siteQuery: BASiteQuery, limit = 10): Promise<TopChannel[]> {
  return getTopChannels(siteQuery, limit);
}

export async function getTopReferrerSourcesForSite(
  siteQuery: BASiteQuery,
  limit = 10,
): Promise<TopReferrerSource[]> {
  return getTopReferrerSources(siteQuery, limit);
}

export async function getReferrerSummaryWithChartsForSite(siteQuery: BASiteQuery): Promise<ReferrerSummaryWithCharts> {
  const [referralSessionsChartData, referralPercentageChartData, avgSessionDurationChartData, topReferrerSource] =
    await Promise.all([
      getDailyReferralSessions(siteQuery),
      getDailyReferralTrafficPercentage(siteQuery),
      getDailyReferralSessionDuration(siteQuery),
      getTopReferrerSource(siteQuery),
    ]);

  const referralSessions = referralSessionsChartData.reduce((sum, day) => sum + day.referralSessions, 0);

  const avgReferralPercentage =
    referralPercentageChartData.length > 0
      ? referralPercentageChartData.reduce((sum, day) => sum + day.referralPercentage, 0) /
        referralPercentageChartData.length
      : 0;

  const totalSessions =
    avgReferralPercentage > 0 ? Math.round(referralSessions / (avgReferralPercentage / 100)) : referralSessions;

  const avgSessionDuration =
    avgSessionDurationChartData.length > 0
      ? avgSessionDurationChartData.reduce((sum, day) => sum + day.avgSessionDuration, 0) /
        avgSessionDurationChartData.length
      : 0;

  const result = {
    referralSessions,
    totalSessions,
    topReferrerSource,
    avgSessionDuration: Number(avgSessionDuration.toFixed(1)),
    referralSessionsChartData,
    referralPercentageChartData,
    avgSessionDurationChartData,
  };

  return ReferrerSummaryWithChartsSchema.parse(result);
}
