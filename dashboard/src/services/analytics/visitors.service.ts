'server-only';

import {
  getUniqueVisitors,
  getSessionMetrics,
  getActiveUsersCount,
  getSessionRangeMetrics,
} from '@/repositories/clickhouse/index.repository';
import { SummaryStatsWithChartsSchema } from '@/entities/analytics/stats.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { getTotalPageViewsForSite } from '@/services/analytics/pages.service';

export async function getUniqueVisitorsForSite(siteQuery: BASiteQuery) {
  return getUniqueVisitors(siteQuery);
}

export async function getSummaryStatsWithChartsForSite(siteQuery: BASiteQuery) {
  const [visitorsChartData, pageviewsChartData, sessionMetricsChartData, sessionMetricsRangeData] =
    await Promise.all([
      getUniqueVisitorsForSite(siteQuery),
      getTotalPageViewsForSite(siteQuery),
      getSessionMetrics(siteQuery),
      getSessionRangeMetrics(siteQuery),
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
