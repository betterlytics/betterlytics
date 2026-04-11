'server only';

import { QueryFilter } from '@/entities/analytics/filter.entities';
import { safeSql, SQL } from './safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { BAQuery } from './ba-query';
import { canUseHourlyMVBoundaries } from './ba-hourly-query';

const MV_COMPATIBLE_COLUMNS = new Set<QueryFilter['column']>(['url']);

function canUseMv(siteQuery: BASiteQuery): boolean {
  if (!siteQuery.queryFilters.every((f) => MV_COMPATIBLE_COLUMNS.has(f.column))) return false;
  return canUseHourlyMVBoundaries(siteQuery);
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
