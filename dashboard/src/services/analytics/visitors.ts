'server-only';

import {
  getUniqueVisitors,
  getSessionMetrics,
  getActiveUsersCount,
  getSessionRangeMetrics,
} from '@/repositories/clickhouse';
import { toDateTimeString } from '@/utils/dateFormatters';
import { SummaryStatsWithChartsSchema } from '@/entities/stats';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/filter';
import { getTotalPageViewsForSite } from '@/services/analytics/pages';

export async function getUniqueVisitorsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
) {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getUniqueVisitors(siteId, formattedStart, formattedEnd, granularity, queryFilters, timezone);
}

export async function getSummaryStatsWithChartsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
) {
  const [visitorsChartData, pageviewsChartData, sessionMetricsChartData, sessionMetricsRangeData] =
    await Promise.all([
      getUniqueVisitorsForSite(siteId, startDate, endDate, granularity, queryFilters, timezone),
      getTotalPageViewsForSite(siteId, startDate, endDate, granularity, queryFilters, timezone),
      getSessionMetrics(
        siteId,
        toDateTimeString(startDate),
        toDateTimeString(endDate),
        granularity,
        queryFilters,
        timezone,
      ),
      getSessionRangeMetrics(siteId, toDateTimeString(startDate), toDateTimeString(endDate), queryFilters),
    ]);

  const uniqueVisitors = visitorsChartData.reduce((sum: number, row) => sum + row.unique_visitors, 0);
  const pageviews = pageviewsChartData.reduce((sum: number, row) => sum + row.views, 0);

  const totalSessions = sessionMetricsRangeData.sessions;

  const totalBounceRate = sessionMetricsRangeData.bounce_rate;

  const totalAvgVisitDuration = sessionMetricsRangeData.avg_visit_duration;

  const avgPagesPerSession = sessionMetricsRangeData.pages_per_session;

  const statsWithCharts = {
    uniqueVisitors,
    pageviews,
    sessions: totalSessions,
    bounceRate: Math.round(totalBounceRate),
    avgVisitDuration: Math.round(totalAvgVisitDuration),
    pagesPerSession: Number(avgPagesPerSession.toFixed(1)),
    visitorsChartData,
    pageviewsChartData,
    sessionsChartData: sessionMetricsChartData,
    bounceRateChartData: sessionMetricsChartData,
    avgVisitDurationChartData: sessionMetricsChartData,
    pagesPerSessionChartData: sessionMetricsChartData,
  };

  return SummaryStatsWithChartsSchema.parse(statsWithCharts);
}

export async function getActiveUsersForSite(siteId: string): Promise<number> {
  return getActiveUsersCount(siteId, 5);
}
