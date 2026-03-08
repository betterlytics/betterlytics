'server-only';

import { subDays, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { getTotalUniqueVisitors, getSessionRangeMetrics } from '@/repositories/clickhouse/visitors.repository';
import { getTopReferrerSources } from '@/repositories/clickhouse/referrers.repository';
import { getTotalPageviewsCount, getTopPagesWithPageviews } from '@/repositories/clickhouse/reports.repository';
import { toDateTimeString } from '@/utils/dateFormatters';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export interface ReportMetrics {
  visitors: number;
  visitorChange: number | null;
  pageViews: number;
  pageViewChange: number | null;
  sessions: number;
  sessionChange: number | null;
  bounceRate: number;
  avgVisitDuration: number;
}

export interface TopPage {
  path: string;
  pageviews: number;
}

export interface TopSource {
  source: string;
  visits: number;
}

export interface ReportData {
  dashboardId: string;
  siteId: string;
  domain: string;
  periodType: 'weekly' | 'monthly';
  period: {
    start: Date;
    end: Date;
  };
  comparisonPeriod: {
    start: Date;
    end: Date;
  };
  metrics: ReportMetrics;
  topPages: TopPage[];
  topSources: TopSource[];
}

function calculatePercentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export async function getWeeklyReportData(
  dashboardId: string,
  siteId: string,
  domain: string,
): Promise<ReportData> {
  const now = new Date();

  const currentEnd = endOfDay(subDays(now, 1));
  const currentStart = startOfDay(subDays(currentEnd, 6));

  const comparisonEnd = endOfDay(subDays(currentStart, 1));
  const comparisonStart = startOfDay(subDays(comparisonEnd, 6));

  return getReportDataForPeriod(
    dashboardId,
    siteId,
    domain,
    'weekly',
    currentStart,
    currentEnd,
    comparisonStart,
    comparisonEnd,
  );
}

export async function getMonthlyReportData(
  dashboardId: string,
  siteId: string,
  domain: string,
): Promise<ReportData> {
  const now = new Date();

  const lastMonth = subMonths(now, 1);
  const currentStart = startOfMonth(lastMonth);
  const currentEnd = endOfMonth(lastMonth);

  const twoMonthsAgo = subMonths(now, 2);
  const comparisonStart = startOfMonth(twoMonthsAgo);
  const comparisonEnd = endOfMonth(twoMonthsAgo);

  return getReportDataForPeriod(
    dashboardId,
    siteId,
    domain,
    'monthly',
    currentStart,
    currentEnd,
    comparisonStart,
    comparisonEnd,
  );
}

async function getReportDataForPeriod(
  dashboardId: string,
  siteId: string,
  domain: string,
  periodType: 'weekly' | 'monthly',
  currentStart: Date,
  currentEnd: Date,
  comparisonStart: Date,
  comparisonEnd: Date,
): Promise<ReportData> {
  const baseSiteQuery: Omit<BASiteQuery, 'startDate' | 'endDate' | 'startDateTime' | 'endDateTime'> = {
    siteId,
    granularity: 'day',
    queryFilters: [],
    timezone: 'UTC',
    userJourney: { numberOfSteps: 3, numberOfJourneys: 5 },
  };

  const currentQuery: BASiteQuery = {
    ...baseSiteQuery,
    startDate: currentStart,
    endDate: currentEnd,
    startDateTime: toDateTimeString(currentStart),
    endDateTime: toDateTimeString(currentEnd),
  };

  const comparisonQuery: BASiteQuery = {
    ...baseSiteQuery,
    startDate: comparisonStart,
    endDate: comparisonEnd,
    startDateTime: toDateTimeString(comparisonStart),
    endDateTime: toDateTimeString(comparisonEnd),
  };

  const [
    currentVisitors,
    comparisonVisitors,
    currentPageViews,
    comparisonPageViews,
    currentSessionMetrics,
    comparisonSessionMetrics,
    topPages,
    topSources,
  ] = await Promise.all([
    getTotalUniqueVisitors(currentQuery),
    getTotalUniqueVisitors(comparisonQuery),
    getTotalPageviewsCount(currentQuery),
    getTotalPageviewsCount(comparisonQuery),
    getSessionRangeMetrics(currentQuery),
    getSessionRangeMetrics(comparisonQuery),
    getTopPagesWithPageviews(currentQuery, 10),
    getTopReferrerSources(currentQuery, 10),
  ]);

  const metrics: ReportMetrics = {
    visitors: currentVisitors,
    visitorChange: calculatePercentChange(currentVisitors, comparisonVisitors),
    pageViews: currentPageViews,
    pageViewChange: calculatePercentChange(currentPageViews, comparisonPageViews),
    sessions: currentSessionMetrics.sessions,
    sessionChange: calculatePercentChange(currentSessionMetrics.sessions, comparisonSessionMetrics.sessions),
    bounceRate: Math.round(currentSessionMetrics.bounce_rate),
    avgVisitDuration: Math.round(currentSessionMetrics.avg_visit_duration),
  };

  return {
    dashboardId,
    siteId,
    domain,
    periodType,
    period: { start: currentStart, end: currentEnd },
    comparisonPeriod: { start: comparisonStart, end: comparisonEnd },
    metrics,
    topPages: topPages.map((p) => ({ path: p.url, pageviews: p.pageviews })),
    topSources: topSources.map((s) => ({ source: s.referrer_source, visits: s.visits })),
  };
}
