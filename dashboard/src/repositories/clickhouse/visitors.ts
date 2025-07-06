import { clickhouse } from '@/lib/clickhouse';
import { DailyUniqueVisitorsRow, DailyUniqueVisitorsRowSchema } from '@/entities/visitors';
import { DailySessionMetricsRow, DailySessionMetricsRowSchema } from '@/entities/sessionMetrics';
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
    WITH session_data AS (
      SELECT
        session_id,
        ${granularityFunc('timestamp', startDate)} as date,
        count() as page_count,
        if(count() > 1,
          dateDiff('second', min(timestamp), max(timestamp)),
          0
        ) as duration_seconds
      FROM analytics.events
      WHERE site_id = {site_id:String}
        AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
        AND ${SQL.AND(filters)}
      GROUP BY session_id, date
    )
    SELECT 
      date,
      if(count() > 0, 
        round((count() - countIf(page_count > 1)) / count() * 100, 1), 
        0
      ) as bounce_rate,
      if(countIf(page_count > 1) > 0,
        round(avgIf(duration_seconds, page_count > 1), 0),
        0
      ) as avg_visit_duration,
      if(count() > 0,
        round(sum(page_count) / count(), 1),
        0
      ) as pages_per_session
    FROM session_data
    GROUP BY date
    ORDER BY date ASC
    LIMIT 10080
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
