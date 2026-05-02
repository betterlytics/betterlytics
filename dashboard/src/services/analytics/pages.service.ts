'server-only';

import {
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
  getAverageTimeOnPage,
} from '@/repositories/clickhouse/index.repository';
import { getSessionMetrics } from '@/repositories/clickhouse/sessions.repository';
import { TotalPageViewsRow } from '@/entities/analytics/pageviews.entities';
import {
  PageAnalytics,
  TopPageRow,
  TopEntryPageRow,
  TopExitPageRow,
  DailyAverageTimeRow,
  DailyBounceRateRow,
  AverageTimeOnPageRow,
  PagesSummaryWithCharts,
  PagesSummaryWithChartsSchema,
} from '@/entities/analytics/pages.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { isSubDayGranularity } from '@/utils/granularityRanges';

function weightedAverage<T>(
  rows: T[],
  value: (row: T) => number,
  weight: (row: T) => number,
): number {
  const totalWeight = rows.reduce((sum, row) => sum + weight(row), 0);
  if (totalWeight === 0) return 0;
  return rows.reduce((sum, row) => sum + value(row) * weight(row), 0) / totalWeight;
}

export async function getTotalPageViewsForSite(siteQuery: BASiteQuery): Promise<TotalPageViewsRow[]> {
  return getTotalPageViews(siteQuery);
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
  const [pageviewsChartData, dailyAvgTimeData, dailyBounceRateData, sessionMetricsData, avgTimeOnPageData] =
    await Promise.all([
      getTotalPageViewsForSite(siteQuery),
      getDailyAverageTimeOnPageForSite(siteQuery),
      getDailyBounceRateForSite(siteQuery),
      getSessionMetrics(siteQuery),
      isSubDayGranularity(siteQuery.granularity) ? getAverageTimeOnPageForSite(siteQuery) : null,
    ]);

  const totalPageviews = pageviewsChartData.reduce((sum, row) => sum + row.views, 0);

  const avgTimeOnPage =
    avgTimeOnPageData?.avgTime ??
    weightedAverage(dailyAvgTimeData, (r) => r.avgTime, (r) => r.visitCount);

  const avgBounceRate = weightedAverage(
    dailyBounceRateData,
    (r) => r.bounceRate,
    (r) => r.sessions,
  );

  const avgPagesPerSession = weightedAverage(
    sessionMetricsData,
    (r) => r.pages_per_session,
    (r) => r.sessions,
  );

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

export async function getAverageTimeOnPageForSite(
  siteQuery: BASiteQuery,
): Promise<AverageTimeOnPageRow> {
  return getAverageTimeOnPage(siteQuery);
}

export async function getDailyBounceRateForSite(siteQuery: BASiteQuery): Promise<DailyBounceRateRow[]> {
  return getDailyBounceRate(siteQuery);
}
