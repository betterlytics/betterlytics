'server-only';

import { getCustomEventsOverview } from '@/repositories/clickhouse';
import { toDateTimeString } from '@/utils/dateFormatters';

export async function getCustomEventsOverviewForSite(siteId: string, startDate: Date, endDate: Date) {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);
  return getCustomEventsOverview(siteId, formattedStart, formattedEnd);
}
