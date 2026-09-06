import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import type { ResolvedTimeRange } from '@/mcp/utils/resolveTimeRange';

type BuildSiteQueryInput = {
  siteId: string;
  timeRange: ResolvedTimeRange;
  timezone?: string;
  granularity?: BASiteQuery['granularity'];
  queryFilters?: BASiteQuery['queryFilters'];
  userJourney?: BASiteQuery['userJourney'];
};

const DEFAULT_GRANULARITY: BASiteQuery['granularity'] = 'day';
const DEFAULT_TIMEZONE = 'UTC';

// BASiteQuery requires userJourney, but only the user_journeys tool reads it. Every other
// tool gets this filler, so the dummy values live here instead of in each tool.
const DEFAULT_USER_JOURNEY: BASiteQuery['userJourney'] = { numberOfSteps: 3, numberOfJourneys: 50 };

export function buildSiteQuery({
  siteId,
  timeRange,
  timezone,
  granularity,
  queryFilters,
  userJourney,
}: BuildSiteQueryInput): BASiteQuery {
  return {
    siteId,
    startDate: timeRange.start,
    endDate: timeRange.end,
    startDateTime: timeRange.startDateTime,
    endDateTime: timeRange.endDateTime,
    granularity: granularity ?? DEFAULT_GRANULARITY,
    queryFilters: queryFilters ?? [],
    timezone: timezone ?? DEFAULT_TIMEZONE,
    userJourney: userJourney ?? { ...DEFAULT_USER_JOURNEY },
  };
}
