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
import { toDateTimeString } from '@/utils/dateFormatters';
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
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/analytics/filter.entities';

/**
 * Gets the aggregated referrers by source for a given site and time period
 */
export async function getReferrerSourceAggregationDataForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
): Promise<ReferrerSourceAggregation[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  return getReferrerDistribution(siteId, formattedStart, formattedEnd, queryFilters);
}

/**
 * Gets the referrer traffic trend data grouped by source for a given site and time period
 */
export async function getReferrerTrafficTrendBySourceDataForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<ReferrerTrafficBySourceRow[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  return getReferrerTrafficTrendBySource(
    siteId,
    formattedStart,
    formattedEnd,
    granularity,
    queryFilters,
    timezone,
  );
}

/**
 * Gets detailed referrer data for table display
 */
export async function getReferrerTableDataForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
  limit = 100,
): Promise<ReferrerTableRow[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  const result = await getReferrerTableData(siteId, formattedStart, formattedEnd, queryFilters, limit);

  return result.map((row) => ReferrerTableRowSchema.parse(row));
}

/**
 * Gets top referrer URLs
 */
export async function getTopReferrerUrlsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
  limit = 10,
): Promise<TopReferrerUrl[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  return getTopReferrerUrls(siteId, formattedStart, formattedEnd, queryFilters, limit);
}

/**
 * Gets top traffic channels
 */
export async function getTopChannelsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
  limit = 10,
): Promise<TopChannel[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  return getTopChannels(siteId, formattedStart, formattedEnd, queryFilters, limit);
}

/**
 * Gets top referrer sources with visit counts
 */
export async function getTopReferrerSourcesForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
  limit = 10,
): Promise<TopReferrerSource[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  return getTopReferrerSources(siteId, formattedStart, formattedEnd, queryFilters, limit);
}

/**
 * Gets summary data about referrers with chart data for a given site and time period
 */
export async function getReferrerSummaryWithChartsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<ReferrerSummaryWithCharts> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  const [referralSessionsChartData, referralPercentageChartData, avgSessionDurationChartData, topReferrerSource] =
    await Promise.all([
      getDailyReferralSessions(siteId, formattedStart, formattedEnd, granularity, queryFilters, timezone),
      getDailyReferralTrafficPercentage(siteId, formattedStart, formattedEnd, granularity, queryFilters, timezone),
      getDailyReferralSessionDuration(siteId, formattedStart, formattedEnd, granularity, queryFilters, timezone),
      getTopReferrerSource(siteId, formattedStart, formattedEnd, queryFilters),
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
