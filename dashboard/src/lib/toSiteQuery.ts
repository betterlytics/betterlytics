import { BAAnalyticsQuerySchema, type BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toDateTimeString } from '@/utils/dateFormatters';

export function toSiteQuery(
  siteId: string,
  query: unknown,
): { main: BASiteQuery; compare: BASiteQuery | null } {
  const parsed = BAAnalyticsQuerySchema.parse(query);
  const main: BASiteQuery = {
    siteId,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    startDateTime: toDateTimeString(parsed.startDate),
    endDateTime: toDateTimeString(parsed.endDate),
    granularity: parsed.granularity,
    queryFilters: parsed.queryFilters,
    timezone: parsed.timezone,
    userJourney: parsed.userJourney,
  };
  const compare =
    parsed.compareStartDate && parsed.compareEndDate
      ? {
          ...main,
          startDate: parsed.compareStartDate,
          endDate: parsed.compareEndDate,
          startDateTime: toDateTimeString(parsed.compareStartDate),
          endDateTime: toDateTimeString(parsed.compareEndDate),
        }
      : null;
  return { main, compare };
}
