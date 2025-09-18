import { clickhouse } from '@/lib/clickhouse';
import { DailyUniqueVisitorsRow, DailyUniqueVisitorsRowSchema } from '@/entities/visitors';
import {
  DailySessionMetricsRow,
  DailySessionMetricsRowSchema,
  RangeSessionMetrics,
  RangeSessionMetricsSchema,
} from '@/entities/sessionMetrics';
import { DateString } from '@/types/dates';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { BAQuery } from '@/lib/ba-query';
import { QueryFilter } from '@/entities/filter';
import { safeSql, SQL } from '@/lib/safe-sql';

export async function getUniqueVisitors(
  siteId: string,
  startDate: DateString,
  endDate: DateString,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
): Promise<DailyUniqueVisitorsRow[]> {
  const granularityFunc = BAQuery.getGranularitySQLFunctionFromGranularityRange(granularity);
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    WITH first_visitor_appearances AS (
      SELECT 
        visitor_id,
        min(timestamp) as custom_date
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND ${SQL.AND(filters)}
      GROUP BY visitor_id
    )
    SELECT
      ${granularityFunc('custom_date', startDate)} as date,
      uniq(visitor_id) as unique_visitors
    FROM first_visitor_appearances
    GROUP BY date
    ORDER BY date ASC
    LIMIT 10080
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
      },
    })
    .toPromise()) as any[];
  return result.map((row) => DailyUniqueVisitorsRowSchema.parse(row));
}

export async function getTotalUniqueVisitors(
  siteId: string,
  startDate: DateString,
  endDate: DateString,
  queryFilters: QueryFilter[],
): Promise<number> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const queryResponse = safeSql`
    SELECT uniq(visitor_id) as unique_visitors
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
  `;

  const result = (await clickhouse
    .query(queryResponse.taggedSql, {
      params: {
        ...queryResponse.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
      },
    })
    .toPromise()) as any[];
  return Number(result[0]?.unique_visitors ?? 0);
}

export async function getSessionMetrics(
  siteId: string,
  startDate: DateString,
  endDate: DateString,
  granularity: GranularityRangeValues,
  queryFilters: QueryFilter[],
): Promise<DailySessionMetricsRow[]> {
  const granularityFunc = BAQuery.getGranularitySQLFunctionFromGranularityRange(granularity);
  const filters = BAQuery.getFilterQuery(queryFilters);

  const queryResponse = safeSql`
    WITH per_session AS (
      SELECT
        session_id,
        countIf(event_type = 'pageview') as page_count,
        min(timestamp) AS custom_date,
        max(timestamp) AS session_end,
        dateDiff('second', min(timestamp), max(timestamp)) AS duration_seconds
      FROM analytics.events
      WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
      GROUP BY session_id
      ORDER BY custom_date DESC
    )
    SELECT
      ${granularityFunc('custom_date', startDate)} as date,
      count() AS sessions,
      countIf(page_count > 1) AS sessions_with_multiple_page_views,
      sum(page_count) AS number_of_page_views,
      sum(duration_seconds) AS sum_duration,
      if (sessions_with_multiple_page_views > 0,
          round(sum_duration / sessions_with_multiple_page_views),
          0
      ) AS avg_visit_duration,
      if (sessions > 0,
          (sessions - sessions_with_multiple_page_views) / sessions,
          0
      ) AS bounce_rate,
      if (number_of_page_views > 0,
        number_of_page_views / sessions,
        0
      ) AS pages_per_session
    FROM per_session
    GROUP BY date
    ORDER BY date DESC
    LIMIT 10080;
  `;

  const result = (await clickhouse
    .query(queryResponse.taggedSql, {
      params: {
        ...queryResponse.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
      },
    })
    .toPromise()) as any[];

  return result.map((row) => DailySessionMetricsRowSchema.parse(row));
}

export async function getSessionRangeMetrics(
  siteId: string,
  startDate: DateString,
  endDate: DateString,
  queryFilters: QueryFilter[],
): Promise<RangeSessionMetrics> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const queryResponse = safeSql`
    WITH per_session AS (
      SELECT
        session_id,
        countIf(event_type = 'pageview') as page_count,
        min(timestamp) AS custom_date,
        max(timestamp) AS session_end,
        dateDiff('second', min(timestamp), max(timestamp)) AS duration_seconds
      FROM analytics.events
      WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
      GROUP BY session_id
      ORDER BY custom_date DESC
    )
    SELECT
      count() AS sessions,
      countIf(page_count > 1) AS sessions_with_multiple_page_views,
      sum(page_count) AS number_of_page_views,
      sum(duration_seconds) AS sum_duration,
      if (sessions_with_multiple_page_views > 0,
          round(sum_duration / sessions_with_multiple_page_views),
          0
      ) AS avg_visit_duration,
      if (sessions > 0,
          100 * (sessions - sessions_with_multiple_page_views) / sessions,
          0
      ) AS bounce_rate,
      if (number_of_page_views > 0,
        number_of_page_views / sessions,
        0
      ) AS pages_per_session
    FROM per_session
    LIMIT 1;
  `;

  const result = await clickhouse
    .query(queryResponse.taggedSql, {
      params: {
        ...queryResponse.taggedParams,
        site_id: siteId,
        start: startDate,
        end: endDate,
      },
    })
    .toPromise();

  return RangeSessionMetricsSchema.parse(result[0]);
}

export async function getActiveUsersCount(siteId: string, minutesWindow: number = 5): Promise<number> {
  const query = safeSql`
    SELECT uniq(visitor_id) as active_users
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp >= now() - INTERVAL {minutes_window:UInt32} MINUTE
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        minutes_window: minutesWindow,
      },
    })
    .toPromise()) as Array<{ active_users: number }>;

  return result[0]?.active_users || 0;
}
