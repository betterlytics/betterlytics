'server-only';

import {
  getPageViews,
  getTopPages,
  getPageMetrics,
  getPageDetailMetrics,
  getTotalPageViews,
  getPageTrafficTimeSeries,
} from '@/repositories/clickhouse';
import { DailyPageViewRow, TotalPageViewsRow } from '@/entities/pageviews';
import { toDateTimeString } from '@/utils/dateFormatters';
import { PageAnalytics } from '@/entities/pages';
import { GranularityRangeValues } from '@/utils/granularityRanges';

export async function getTotalPageViewsForSite(siteId: string, startDate: Date, endDate: Date, granularity: GranularityRangeValues): Promise<TotalPageViewsRow[]> {  
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getTotalPageViews(siteId, formattedStart, formattedEnd, granularity);
}

export async function getPageViewsForSite(siteId: string, startDate: Date, endDate: Date, granularity: GranularityRangeValues): Promise<DailyPageViewRow[]> {  
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getPageViews(siteId, formattedStart, formattedEnd, granularity);
}

export async function getTopPagesForSite(siteId: string, startDate: Date, endDate: Date, limit = 5) {
  return getTopPages(siteId, toDateTimeString(startDate), toDateTimeString(endDate), limit);
}

export async function getPageAnalytics(siteId: string, startDate: Date, endDate: Date): Promise<PageAnalytics[]> {
  return getPageMetrics(siteId, toDateTimeString(startDate), toDateTimeString(endDate));
}

export async function getPageDetail(siteId: string, path: string, startDate: Date, endDate: Date): Promise<PageAnalytics | null> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getPageDetailMetrics(siteId, path, formattedStart, formattedEnd);
}

export async function getPageTrafficForTimePeriod(
  siteId: string, 
  path: string,
  startDate: Date, 
  endDate: Date, 
  granularity: GranularityRangeValues
): Promise<TotalPageViewsRow[]> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getPageTrafficTimeSeries(siteId, path, formattedStart, formattedEnd, granularity);
}
