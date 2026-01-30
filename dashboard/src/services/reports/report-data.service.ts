'server-only';

import { subDays, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { getTotalUniqueVisitors, getSessionRangeMetrics } from '@/repositories/clickhouse/visitors.repository';
import { getTopReferrerSources } from '@/repositories/clickhouse/referrers.repository';
import { getTotalPageviewsCount, getTopPagesWithPageviews } from '@/repositories/clickhouse/reports.repository';
import { toDateTimeString } from '@/utils/dateFormatters';

export interface ReportMetrics {
  visitors: number;
  visitorChange: number;
  pageViews: number;
  pageViewChange: number;
  sessions: number;
  sessionChange: number;
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

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
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
  const currentStartStr = toDateTimeString(currentStart);
  const currentEndStr = toDateTimeString(currentEnd);
  const comparisonStartStr = toDateTimeString(comparisonStart);
  const comparisonEndStr = toDateTimeString(comparisonEnd);

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
    getTotalUniqueVisitors(siteId, currentStartStr, currentEndStr, []),
    getTotalUniqueVisitors(siteId, comparisonStartStr, comparisonEndStr, []),
    getTotalPageviewsCount(siteId, currentStartStr, currentEndStr, []),
    getTotalPageviewsCount(siteId, comparisonStartStr, comparisonEndStr, []),
    getSessionRangeMetrics(siteId, currentStartStr, currentEndStr, []),
    getSessionRangeMetrics(siteId, comparisonStartStr, comparisonEndStr, []),
    getTopPagesWithPageviews(siteId, currentStartStr, currentEndStr, 10, []),
    getTopReferrerSources(siteId, currentStartStr, currentEndStr, [], 10),
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
