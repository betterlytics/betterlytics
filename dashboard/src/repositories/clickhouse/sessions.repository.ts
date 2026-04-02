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

  const { WHERE, HAVING, FINAL } = BASessionQuery.getSessionFilterQuery(
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
  );

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
        pageview_count
      FROM analytics.sessions ${FINAL}
      WHERE site_id = {site_id:String}
        AND session_created_at BETWEEN {start:DateTime} AND {end:DateTime}
        AND ${SQL.AND(WHERE)}
      HAVING ${SQL.AND(HAVING)}
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
