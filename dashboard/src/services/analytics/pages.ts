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
} from '@/repositories/clickhouse';
import { getSessionMetrics } from '@/repositories/clickhouse/visitors';
import { DailyPageViewRow, TotalPageViewsRow } from '@/entities/pageviews';
import { toDateTimeString } from '@/utils/dateFormatters';
import {
  PageAnalytics,
  TopPageRow,
  TopEntryPageRow,
  TopExitPageRow,
  DailyAverageTimeRow,
  DailyBounceRateRow,
  PagesSummaryWithCharts,
  PagesSummaryWithChartsSchema,
} from '@/entities/pages';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { QueryFilter } from '@/entities/filter';

export async function getTotalPageViewsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<TotalPageViewsRow[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getTotalPageViews(siteId, formattedStart, formattedEnd, granularity, queryFilters, timezone);
}

export async function getPageViewsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  timezone: string,
): Promise<DailyPageViewRow[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getPageViews(siteId, formattedStart, formattedEnd, granularity, timezone);
}

export async function getTopPagesForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  limit = 5,
  queryFilters: QueryFilter[] = [],
): Promise<TopPageRow[]> {
  return getTopPages(siteId, toDateTimeString(startDate), toDateTimeString(endDate), limit, queryFilters);
}

export async function getPageAnalytics(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
): Promise<PageAnalytics[]> {
  return getPageMetrics(siteId, toDateTimeString(startDate), toDateTimeString(endDate), queryFilters);
}

export async function getPageDetail(
  siteId: string,
  path: string,
  startDate: Date,
  endDate: Date,
): Promise<PageAnalytics | null> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getPageDetailMetrics(siteId, path, formattedStart, formattedEnd);
}

export async function getPageTrafficForTimePeriod(
  siteId: string,
  path: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  timezone: string,
): Promise<TotalPageViewsRow[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getPageTrafficTimeSeries(siteId, path, formattedStart, formattedEnd, granularity, timezone);
}

export async function getTopEntryPagesForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  limit = 5,
  queryFilters: QueryFilter[] = [],
): Promise<TopEntryPageRow[]> {
  return getTopEntryPages(siteId, toDateTimeString(startDate), toDateTimeString(endDate), limit, queryFilters);
}

export async function getTopExitPagesForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  limit = 5,
  queryFilters: QueryFilter[] = [],
): Promise<TopExitPageRow[]> {
  return getTopExitPages(siteId, toDateTimeString(startDate), toDateTimeString(endDate), limit, queryFilters);
}

export async function getEntryPageAnalyticsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
): Promise<PageAnalytics[]> {
  return getEntryPageAnalyticsRepo(
    siteId,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
    100,
    queryFilters,
  );
}

export async function getExitPageAnalyticsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
): Promise<PageAnalytics[]> {
  return getExitPageAnalyticsRepo(
    siteId,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
    100,
    queryFilters,
  );
}

export async function getPagesSummaryWithChartsForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<PagesSummaryWithCharts> {
  const [pageAnalytics, pageviewsChartData, dailyAvgTimeData, dailyBounceRateData, sessionMetricsData] =
    await Promise.all([
      getPageAnalytics(siteId, startDate, endDate, queryFilters),
      getTotalPageViewsForSite(siteId, startDate, endDate, granularity, queryFilters, timezone),
      getDailyAverageTimeOnPageForSite(siteId, startDate, endDate, granularity, queryFilters, timezone),
      getDailyBounceRateForSite(siteId, startDate, endDate, granularity, queryFilters, timezone),
      getSessionMetrics(
        siteId,
        toDateTimeString(startDate),
        toDateTimeString(endDate),
        granularity,
        queryFilters,
        timezone,
      ),
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

export async function getDailyAverageTimeOnPageForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<DailyAverageTimeRow[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getDailyAverageTimeOnPage(siteId, formattedStart, formattedEnd, granularity, queryFilters, timezone);
}

export async function getDailyBounceRateForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
  timezone: string,
): Promise<DailyBounceRateRow[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getDailyBounceRate(siteId, formattedStart, formattedEnd, granularity, queryFilters, timezone);
}
