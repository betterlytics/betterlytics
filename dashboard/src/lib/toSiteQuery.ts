import { BAAnalyticsQuery, BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toDateTimeString } from '@/utils/dateFormatters';

export function toSiteQuery(
  siteId: string,
  query: BAAnalyticsQuery,
): { main: BASiteQuery; compare: BASiteQuery | null } {
  const main: BASiteQuery = {
    siteId,
    startDate: query.startDate,
    endDate: query.endDate,
    startDateTime: toDateTimeString(query.startDate),
    endDateTime: toDateTimeString(query.endDate),
    granularity: query.granularity,
    queryFilters: query.queryFilters,
    timezone: query.timezone,
    userJourney: query.userJourney,
  };
  const compare =
    query.compareStartDate && query.compareEndDate
      ? {
          ...main,
          startDate: query.compareStartDate,
          endDate: query.compareEndDate,
          startDateTime: toDateTimeString(query.compareStartDate),
          endDateTime: toDateTimeString(query.compareEndDate),
        }
      : null;
  return { main, compare };
}
