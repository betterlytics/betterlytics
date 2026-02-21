'server-only';

import {
  getPageViews,
  getTopPages,
  getPageMetrics,
  getPageDetailMetrics,
  getTotalPageViews,
  getPageTrafficTimeSeries,
  getTopEntryPages,
  getTopExitPages,
  getEntryPageAnalytics as getEntryPageAnalyticsRepo,
  getExitPageAnalytics as getExitPageAnalyticsRepo,
  getDailyAverageTimeOnPage,
  getDailyBounceRate,
} from '@/repositories/clickhouse/index.repository';
import { getSessionMetrics } from '@/repositories/clickhouse/visitors.repository';
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

export async function getPageDetail(siteQuery: BASiteQuery, path: string): Promise<PageAnalytics | null> {
  return getPageDetailMetrics(siteQuery, path);
}

export async function getPageTrafficForTimePeriod(siteQuery: BASiteQuery, path: string): Promise<TotalPageViewsRow[]> {
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
  const [pageAnalytics, pageviewsChartData, dailyAvgTimeData, dailyBounceRateData, sessionMetricsData] =
    await Promise.all([
      getPageAnalytics(siteQuery),
      getTotalPageViewsForSite(siteQuery),
      getDailyAverageTimeOnPageForSite(siteQuery),
      getDailyBounceRateForSite(siteQuery),
      getSessionMetrics(siteQuery),
    ]);

  const totalPages = pageAnalytics.length;
  const totalPageviews = pageAnalytics.reduce((sum, page) => sum + page.pageviews, 0);
  const avgTimeOnPage = pageAnalytics.reduce((sum, page) => sum + page.avgTime, 0) / Math.max(totalPages, 1);
  const avgBounceRate = pageAnalytics.reduce((sum, page) => sum + page.bounceRate, 0) / Math.max(totalPages, 1);

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
    avgTimeOnPage: Math.round(avgTimeOnPage),
    avgBounceRate: Math.round(avgBounceRate),
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
