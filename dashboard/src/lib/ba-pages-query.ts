'server only';

import { QueryFilter } from '@/entities/analytics/filter.entities';
import { safeSql, SQL } from './safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { BAQuery } from './ba-query';

const MV_COMPATIBLE_COLUMNS = new Set<QueryFilter['column']>(['url']);

const HOUR_MS = 3_600_000;

// Returns true when the page_stats MV can produce exact results.
//
// Two boundary conditions must hold:
//
// Start boundary: start must be hour-aligned. If it isn't, the first bucket
// (toStartOfHour(start)) would include events before start.
//
// End boundary: the last bucket must not contain events after `end` that exist
// in the database. Three safe patterns:
//
//   a) end >= now — the last bucket covers [lastHour, lastHour+1h), which
//      extends past `end`. But events after `end` don't exist yet (they're in
//      the future), so the bucket only contains data up to now = end.
//
//   b) (end + 1s) % 1h === 0 — end is 1 second before a full-hour boundary.
//      This is the standard convention from ba-timerange.ts: getResolvedRanges
//      always subtracts 1s from range ends, so "yesterday" becomes 23:59:59,
//      "last 7 days" ends at 23:59:59, etc. The last bucket (23:00) contains
//      only events with timestamps ≤ 23:59:59, which is exactly our range.
//
//   c) end % 1h === 0 — exact hour boundary (defensive; ba-timerange never
//      produces this, but custom callers might). toStartOfHour(end - 1s) = the
//      previous complete hour bucket, whose events are all strictly < end.
//
// The MV SQL uses toStartOfHour(subtractSeconds(end, 1)) as the upper bound,
// which resolves all three cases without extra parameters.
function canUseMv(siteQuery: BASiteQuery): boolean {
  if (!siteQuery.queryFilters.every((f) => MV_COMPATIBLE_COLUMNS.has(f.column))) return false;

  const startMs = new Date(siteQuery.startDateTime).getTime();
  const endMs = new Date(siteQuery.endDateTime).getTime();
  const nowMs = Date.now();

  // Start must be on an exact hour boundary
  if (startMs % HOUR_MS !== 0) return false;

  const endIsCurrentOrFuture = endMs >= nowMs;
  // True when end falls on a clean hour boundary (either XX:00:00 or XX:59:59, the
  // ba-timerange -1s convention). Both forms mean no partial bucket spills past end.
  const endIsHourBoundary = endMs % HOUR_MS === 0 || (endMs + 1000) % HOUR_MS === 0;

  if (!endIsCurrentOrFuture && !endIsHourBoundary) return false;

  // Compute the last MV bucket safely includable.
  // For exact hour (e.g. today 00:00): skip that bucket, it includes post-end events.
  // For 23:59:59 or real-time: toStartOfHour(end) is the correct last bucket.
  const isExactHour = endMs % HOUR_MS === 0;
  const effectiveEndHourMs =
    isExactHour && !endIsCurrentOrFuture ? endMs - HOUR_MS : Math.floor(endMs / HOUR_MS) * HOUR_MS;

  return effectiveEndHourMs >= startMs;
}

function buildColumnFilter(queryFilters: QueryFilter[], targetColumn: string, paramPrefix: string) {
  const urlFilters = queryFilters.filter((f) => f.column === 'url');
  if (urlFilters.length === 0) return [safeSql`1=1`];

  const col = SQL.Unsafe(targetColumn);
  return urlFilters.map((filter, i) => {
    const values = SQL.StringArray({
      [`${paramPrefix}_${i}`]: filter.values.map((v) => v.replaceAll('*', '%')),
    });
    return filter.operator === '='
      ? safeSql`arrayExists(pattern -> ${col} ILIKE pattern, ${values})`
      : safeSql`arrayAll(pattern -> ${col} NOT ILIKE pattern, ${values})`;
  });
}

// Reads pageview, engagement, and scroll_depth events, grouped by (url, session_id).
function getPageSessionCte(siteQuery: BASiteQuery) {
  const filters = BAQuery.getFilterQuery(siteQuery.queryFilters);
  return safeSql`
    page_session AS (
      SELECT
        url                                                                                  AS path,
        session_id,
        countIf(event_type = 'pageview')                                                    AS pv_count,
        minIf(timestamp, event_type = 'pageview')                                           AS first_ts,
        maxIf(timestamp, event_type = 'pageview')                                           AS last_ts,
        avgIf(toFloat64(duration), event_type = 'engagement' AND duration > 0)              AS avg_duration,
        if(
          countIf(scroll_depth_percentage IS NOT NULL AND event_type IN ('engagement', 'scroll_depth')) > 0,
          maxIf(scroll_depth_percentage, scroll_depth_percentage IS NOT NULL AND event_type IN ('engagement', 'scroll_depth')),
          NULL
        )                                                                                   AS max_scroll
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND event_type IN ('pageview', 'engagement', 'scroll_depth')
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND ${SQL.AND(filters)}
      GROUP BY url, session_id
    )
  `;
}

function getPageStatsCte(siteQuery: BASiteQuery) {
  const pathFilters = buildColumnFilter(siteQuery.queryFilters, 'path', 'url_path_filter');
  return safeSql`
    page_agg AS (
      SELECT
        path,
        uniqMerge(visitors_state)                                                            AS visitors,
        sum(pageviews_state)                                                                  AS pageviews,
        if(sum(duration_count) > 0, sum(duration_sum) / sum(duration_count), 0)              AS avg_time_seconds,
        if(sum(scroll_depth_count) > 0, sum(scroll_depth_sum) / sum(scroll_depth_count), 0)  AS avg_scroll_depth
      FROM analytics.page_stats
      WHERE site_id = {site_id:String}
        AND hour BETWEEN {start:DateTime} AND toStartOfHour(subtractSeconds({end:DateTime}, 1))
        AND ${SQL.AND(pathFilters)}
      GROUP BY path
    )
  `;
}

function getPagePathFilters(queryFilters: QueryFilter[]) {
  return buildColumnFilter(queryFilters, 'path', 'url_path_filter');
}

function getEntryPathFilters(queryFilters: QueryFilter[]) {
  return buildColumnFilter(queryFilters, 'entry_page.2', 'url_entry_filter');
}

function getExitPathFilters(queryFilters: QueryFilter[]) {
  return buildColumnFilter(queryFilters, 'exit_page.2', 'url_exit_filter');
}

export const BAPageQuery = {
  canUseMv,
  getPageSessionCte,
  getPageStatsCte,
  getPagePathFilters,
  getEntryPathFilters,
  getExitPathFilters,
};
