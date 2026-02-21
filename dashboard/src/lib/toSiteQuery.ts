import { BAAnalyticsQuery, BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export function toSiteQuery(
  siteId: string,
  query: BAAnalyticsQuery,
): { main: BASiteQuery; compare: BASiteQuery | null } {
  const main: BASiteQuery = {
    siteId,
    startDate: query.startDate,
    endDate: query.endDate,
    granularity: query.granularity,
    queryFilters: query.queryFilters,
    timezone: query.timezone,
    userJourney: query.userJourney,
  };
  const compare =
    query.compareStartDate && query.compareEndDate
      ? { ...main, startDate: query.compareStartDate, endDate: query.compareEndDate }
      : null;
  return { main, compare };
}
