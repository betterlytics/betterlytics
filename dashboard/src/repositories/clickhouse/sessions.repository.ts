'server only';

import { clickhouse } from '@/lib/clickhouse';
import {
  DailySessionMetricsRow,
  DailySessionMetricsRowSchema,
  RangeSessionMetrics,
  RangeSessionMetricsSchema,
} from '@/entities/analytics/sessionMetrics.entities';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { BASessionQuery } from '@/lib/ba-session-query';

export async function getSessionMetrics(siteQuery: BASiteQuery): Promise<DailySessionMetricsRow[]> {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;

  const { fill, timeWrapper, granularityFunc, range } = BASessionQuery.getSessionStartRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );
  const { WHERE, HAVING, FINAL } = BASessionQuery.getSessionFilterQuery(
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
  );

  const queryResponse = timeWrapper(
    safeSql`
      SELECT
        ${granularityFunc('session_start')} AS date,
        count() AS sessions,
        countIf(pageview_count > 1) AS sessions_with_multiple_page_views,
        sum(pageview_count) AS number_of_page_views,
        sum(dateDiff('second', session_start, session_end)) AS sum_duration,
        if(sessions_with_multiple_page_views > 0,
          round(sum_duration / sessions_with_multiple_page_views), 0) AS avg_visit_duration,
        if(sessions > 0,
           100 * (sessions - sessions_with_multiple_page_views) / sessions, 0) AS bounce_rate,
        if(number_of_page_views > 0,
          round(number_of_page_views / sessions, 1), 0) AS pages_per_session
      FROM (
        SELECT
          session_created_at,
          session_start,
          session_end,
          pageview_count
        FROM analytics.sessions ${FINAL}
        WHERE site_id = {site_id:String}
          AND ${range}
          AND ${SQL.AND(WHERE)}
        HAVING ${SQL.AND(HAVING)}
      )
      GROUP BY date
      ORDER BY date ASC ${fill}
      LIMIT 10080
    `,
  );

  const result = (await clickhouse
    .query(queryResponse.taggedSql, {
      params: {
        ...queryResponse.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
      },
    })
    .toPromise()) as any[];

  return result.map((row) => DailySessionMetricsRowSchema.parse(row));
}

export async function getSessionRangeMetrics(siteQuery: BASiteQuery): Promise<RangeSessionMetrics> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;

  const unsupported = queryFilters.filter((f) => UNSUPPORTED_SESSION_FILTERS.includes(f.column as any));
  if (unsupported.length > 0) {
    throw new Error(
      `getSessionRangeMetrics does not support filters on: ${unsupported.map((f) => f.column).join(', ')}`,
    );
  }

  const simpleFilters = BAQuery.getFilterQuery(
    queryFilters.filter((f) => !SESSION_AGG_FINALIZE_COLS.has(f.column)),
  );
  const aggFilters = queryFilters.filter((f) => SESSION_AGG_FINALIZE_COLS.has(f.column));
  const having =
    aggFilters.length > 0 ? safeSql`HAVING ${SQL.AND(BAQuery.getFilterQuery(aggFilters))}` : safeSql``;

  const queryResponse = safeSql`
    SELECT
      count() AS sessions,
      countIf(pageview_count > 1) AS sessions_with_multiple_page_views,
      sum(pageview_count) AS number_of_page_views,
      sum(dateDiff('second', session_start, session_end)) AS sum_duration,
      if(sessions_with_multiple_page_views > 0,
        round(sum_duration / sessions_with_multiple_page_views), 0) AS avg_visit_duration,
      if(sessions > 0,
         100 * (sessions - sessions_with_multiple_page_views) / sessions, 0) AS bounce_rate,
      if(number_of_page_views > 0,
        round(number_of_page_views / sessions, 1), 0) AS pages_per_session
    FROM (
      SELECT
        session_start,
        session_end,
        pageview_count,
        finalizeAggregation(referrer_source) AS referrer_source,
        finalizeAggregation(referrer_source_name) AS referrer_source_name,
        finalizeAggregation(referrer_search_term) AS referrer_search_term,
        finalizeAggregation(referrer_url) AS referrer_url,
        finalizeAggregation(utm_source) AS utm_source,
        finalizeAggregation(utm_medium) AS utm_medium,
        finalizeAggregation(utm_campaign) AS utm_campaign,
        finalizeAggregation(utm_term) AS utm_term,
        finalizeAggregation(utm_content) AS utm_content
      FROM analytics.sessions FINAL
      WHERE site_id = {site_id:String}
        AND session_created_at BETWEEN {start:DateTime} AND {end:DateTime}
        AND ${SQL.AND(simpleFilters)}
      ${having}
    )
    LIMIT 1
  `;

  const result = await clickhouse
    .query(queryResponse.taggedSql, {
      params: {
        ...queryResponse.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
      },
    })
    .toPromise();

  return RangeSessionMetricsSchema.parse(result[0]);
}
