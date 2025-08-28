'server-only';

import { getUniqueVisitors, getSessionMetrics, getActiveUsersCount } from '@/repositories/clickhouse';
import { toDateTimeString } from '@/utils/dateFormatters';
import { SummaryStatsWithChartsSchema } from '@/entities/stats';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/filter';
import { getTotalPageViewsForSite } from '@/services/pages';

export async function getUniqueVisitorsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
) {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getUniqueVisitors(siteId, formattedStart, formattedEnd, granularity, queryFilters);
}

export async function getSummaryStatsWithChartsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
) {
  const dailyGranularity: GranularityRangeValues = 'day'; // Always daily for summary cards as lower granularities becomes too noisy

  const [visitorsChartData, pageviewsChartData, sessionMetricsChartData] = await Promise.all([
    getUniqueVisitorsForSite(siteId, startDate, endDate, dailyGranularity, queryFilters),
    getTotalPageViewsForSite(siteId, startDate, endDate, dailyGranularity, queryFilters),
    getSessionMetrics(
      siteId,
      toDateTimeString(startDate),
      toDateTimeString(endDate),
      dailyGranularity,
      queryFilters,
    ),
  ]);

  const uniqueVisitors = visitorsChartData.reduce((sum: number, row) => sum + row.unique_visitors, 0);
  const pageviews = pageviewsChartData.reduce((sum: number, row) => sum + row.views, 0);

  const totalSessions = sessionMetricsChartData.reduce((sum: number, row) => sum + row.sessions, 0);

  const totalBounceRate =
    sessionMetricsChartData.length > 0
      ? sessionMetricsChartData.reduce((sum: number, row) => sum + row.bounce_rate, 0) /
        sessionMetricsChartData.length
      : 0;

  const totalAvgVisitDuration =
    sessionMetricsChartData.length > 0
      ? sessionMetricsChartData.reduce((sum: number, row) => sum + row.avg_visit_duration, 0) /
        sessionMetricsChartData.length
      : 0;

  const avgPagesPerSession =
    sessionMetricsChartData.length > 0
      ? sessionMetricsChartData.reduce((sum: number, row) => sum + row.pages_per_session, 0) /
        sessionMetricsChartData.length
      : 0;

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
