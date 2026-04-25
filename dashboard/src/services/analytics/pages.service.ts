'server-only';

import {
  getPageViews,
  getTopPages,
  getPageMetrics,
  getTotalPageViews,
  getPageTrafficTimeSeries,
  getTopEntryPages,
  getTopExitPages,
  getEntryPageAnalytics as getEntryPageAnalyticsRepo,
  getExitPageAnalytics as getExitPageAnalyticsRepo,
  getDailyAverageTimeOnPage,
  getDailyBounceRate,
  getAvgTimeOnPageScalar,
  getAvgBounceRateScalar,
} from '@/repositories/clickhouse/index.repository';
import { getSessionMetrics } from '@/repositories/clickhouse/sessions.repository';
import { DailyPageViewRow, TotalPageViewsRow } from '@/entities/analytics/pageviews.entities';
import {
  PageAnalytics,
  TopPageRow,
  TopEntryPageRow,
  TopExitPageRow,
  DailyAverageTimeRow,
  DailyBounceRateRow,
  PagesSummaryWithCharts,
  PagesSummaryWithChartsSchema,
} from '@/entities/analytics/pages.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getTotalPageViewsForSite(siteQuery: BASiteQuery): Promise<TotalPageViewsRow[]> {
  return getTotalPageViews(siteQuery);
}

export async function getPageViewsForSite(siteQuery: BASiteQuery): Promise<DailyPageViewRow[]> {
  return getPageViews(siteQuery);
}

export async function getTopPagesForSite(siteQuery: BASiteQuery, limit = 5): Promise<TopPageRow[]> {
  return getTopPages(siteQuery, limit);
}

export async function getPageAnalytics(siteQuery: BASiteQuery): Promise<PageAnalytics[]> {
  return getPageMetrics(siteQuery);
}

export async function getPageTrafficForTimePeriod(
  siteQuery: BASiteQuery,
  path: string,
): Promise<TotalPageViewsRow[]> {
  return getPageTrafficTimeSeries(siteQuery, path);
}

export async function getTopEntryPagesForSite(siteQuery: BASiteQuery, limit = 5): Promise<TopEntryPageRow[]> {
  return getTopEntryPages(siteQuery, limit);
}

export async function getTopExitPagesForSite(siteQuery: BASiteQuery, limit = 5): Promise<TopExitPageRow[]> {
  return getTopExitPages(siteQuery, limit);
}

export async function getEntryPageAnalyticsForSite(siteQuery: BASiteQuery): Promise<PageAnalytics[]> {
  return getEntryPageAnalyticsRepo(siteQuery, 100);
}

export async function getExitPageAnalyticsForSite(siteQuery: BASiteQuery): Promise<PageAnalytics[]> {
  return getExitPageAnalyticsRepo(siteQuery, 100);
}

export async function getPagesSummaryWithChartsForSite(siteQuery: BASiteQuery): Promise<PagesSummaryWithCharts> {
  const [
    pageviewsChartData,
    dailyAvgTimeData,
    dailyBounceRateData,
    sessionMetricsData,
    avgTimeOnPageScalar,
    avgBounceRateScalar,
  ] = await Promise.all([
    getTotalPageViewsForSite(siteQuery),
    getDailyAverageTimeOnPageForSite(siteQuery),
    getDailyBounceRateForSite(siteQuery),
    getSessionMetrics(siteQuery),
    getAvgTimeOnPageScalar(siteQuery),
    getAvgBounceRateScalar(siteQuery),
  ]);

  const totalPageviews = pageviewsChartData.reduce((sum, row) => sum + Number(row.views), 0);

  const totalSessions = sessionMetricsData.reduce((sum, row) => sum + row.sessions, 0);
  const avgPagesPerSession =
    totalSessions > 0
      ? sessionMetricsData.reduce((sum, row) => sum + row.sessions * row.pages_per_session, 0) / totalSessions
      : 0;

  const pagesPerSessionChartData = sessionMetricsData.map((row) => ({
    date: row.date,
    value: row.pages_per_session,
  }));

  const avgTimeChartData = dailyAvgTimeData.map((row) => ({
    date: row.date,
    value: Math.round(row.avgTime),
  }));

  const bounceRateChartData = dailyBounceRateData.map((row) => ({
    date: row.date,
    value: Math.round(row.bounceRate),
  }));

  return PagesSummaryWithChartsSchema.parse({
    totalPageviews,
    avgTimeOnPage: Math.round(avgTimeOnPageScalar),
    avgBounceRate: Math.round(avgBounceRateScalar),
    pagesPerSession: Number(avgPagesPerSession.toFixed(1)),
    pagesPerSessionChartData,
    avgTimeChartData,
    bounceRateChartData,
    pageviewsChartData,
  });
}

export async function getDailyAverageTimeOnPageForSite(siteQuery: BASiteQuery): Promise<DailyAverageTimeRow[]> {
  return getDailyAverageTimeOnPage(siteQuery);
}

export async function getDailyBounceRateForSite(siteQuery: BASiteQuery): Promise<DailyBounceRateRow[]> {
  return getDailyBounceRate(siteQuery);
}
