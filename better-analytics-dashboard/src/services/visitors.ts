'server-only';

import {
  getUniqueVisitors,
  getTotalUniqueVisitors,
  getTotalPageviews,
  getSessionMetrics
} from '@/repositories/clickhouse';
import { toDateTimeString, toDateString } from '@/utils/dateFormatters';
import { SummaryStatsSchema } from '@/entities/stats';
import { GranularityRangeValues } from '@/utils/granularityRanges';

export async function getUniqueVisitorsForSite(siteId: string, startDate: Date, endDate: Date, granularity: GranularityRangeValues) {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getUniqueVisitors(siteId, formattedStart, formattedEnd, granularity);
}

export async function getSummaryStatsForSite(siteId: string, startDate: Date, endDate: Date) {
  const [uniqueVisitors, pageviews, sessionMetrics] = await Promise.all([
    getTotalUniqueVisitors(siteId, toDateString(startDate), toDateString(endDate)),
    getTotalPageviews(siteId, toDateTimeString(startDate), toDateTimeString(endDate)),
    getSessionMetrics(siteId, toDateTimeString(startDate), toDateTimeString(endDate))
  ]);

  const stats = {
    uniqueVisitors,
    pageviews,
    bounceRate: sessionMetrics.total_sessions > 0 
      ? Math.round((sessionMetrics.total_sessions - sessionMetrics.multi_page_sessions) / sessionMetrics.total_sessions * 100)
      : 0,
    avgVisitDuration: sessionMetrics.multi_page_sessions > 0 
      ? Math.round(sessionMetrics.total_duration / sessionMetrics.multi_page_sessions)
      : 0
  };

  return SummaryStatsSchema.parse(stats);
}
