'server-only';

import { QueryFilter } from '@/entities/analytics/filter.entities';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { safeSql, SQL } from './safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const HOUR_MS = 3_600_000;

const HOURLY_MV_COMPATIBLE_GRANULARITIES: Set<GranularityRangeValues> = new Set(['hour', 'day', 'week', 'month']);

const OVERVIEW_HOURLY_COMPATIBLE_COLUMNS = new Set<QueryFilter['column']>([
  'device_type',
  'browser',
  'os',
  'country_code',
]);

const GEO_HOURLY_COMPATIBLE_COLUMNS = new Set<QueryFilter['column']>(['country_code', 'subdivision_code', 'city']);

// Returns true when the time-range boundaries allow an hourly MV to produce exact results.
//
// Start boundary: start must be hour-aligned. If it isn't, the first MV bucket
// (toStartOfHour(session_created_at)) would include sessions created before start.
//
// End boundary: the last bucket must not contain sessions after `end`. Either:
//   a) end >= now (future sessions don't exist yet, so no overcount possible.)
//   b) (end + 1s) % 1h === 0 (the ba-timerange -1s convention (e.g. 23:59:59).)
//      toStartOfHour(23:59:59) = 23:00, whose sessions all fall within our range.
function canUseHourlyMVBoundaries(siteQuery: BASiteQuery): boolean {
  if (!HOURLY_MV_COMPATIBLE_GRANULARITIES.has(siteQuery.granularity)) return false;

  const startMs = siteQuery.startDate.getTime();
  const endMs = siteQuery.endDate.getTime();
  const nowMs = Date.now();

  if (startMs % HOUR_MS !== 0) return false;

  const endIsCurrentOrFuture = endMs >= nowMs;
  const endIsHourBoundary = (endMs + 1000) % HOUR_MS === 0;

  return endIsCurrentOrFuture || endIsHourBoundary;
}

export function canUseOverviewHourlyMV(siteQuery: BASiteQuery): boolean {
  return (
    canUseHourlyMVBoundaries(siteQuery) &&
    siteQuery.queryFilters.every((f) => OVERVIEW_HOURLY_COMPATIBLE_COLUMNS.has(f.column))
  );
}

export function canUseGeoHourlyMV(siteQuery: BASiteQuery): boolean {
  return (
    canUseHourlyMVBoundaries(siteQuery) &&
    siteQuery.queryFilters.every((f) => GEO_HOURLY_COMPATIBLE_COLUMNS.has(f.column))
  );
}

function buildHourlyMvFilters(
  queryFilters: QueryFilter[],
  compatibleColumns: Set<QueryFilter['column']>,
): ReturnType<typeof safeSql>[] {
  const applicable = queryFilters.filter((f) => compatibleColumns.has(f.column));
  if (applicable.length === 0) return [safeSql`1=1`];

  return applicable.map((filter, i) => {
    const col = SQL.Unsafe(filter.column);
    const hasWildcard = filter.values.some((v) => v.includes('*'));

    if (!hasWildcard) {
      const values = SQL.StringArray({ [`hourly_mv_filter_${i}`]: filter.values });
      return filter.operator === '=' ? safeSql`${col} IN ${values}` : safeSql`${col} NOT IN ${values}`;
    }

    const patterns = SQL.StringArray({
      [`hourly_mv_filter_${i}`]: filter.values.map((v) => v.replaceAll('*', '%')),
    });
    return filter.operator === '='
      ? safeSql`arrayExists(pattern -> ${col} ILIKE pattern, ${patterns})`
      : safeSql`arrayAll(pattern -> ${col} NOT ILIKE pattern, ${patterns})`;
  });
}

export function getOverviewHourlyFilters(queryFilters: QueryFilter[]) {
  return buildHourlyMvFilters(queryFilters, OVERVIEW_HOURLY_COMPATIBLE_COLUMNS);
}

export function getGeoHourlyFilters(queryFilters: QueryFilter[]) {
  return buildHourlyMvFilters(queryFilters, GEO_HOURLY_COMPATIBLE_COLUMNS);
}

export const BAHourlyQuery = {
  canUseOverviewHourlyMV,
  canUseGeoHourlyMV,
  getOverviewHourlyFilters,
  getGeoHourlyFilters,
};
