import { clickhouse } from '@/lib/clickhouse';
import { DailyUniqueVisitorsRow, DailyUniqueVisitorsRowSchema } from '@/entities/analytics/visitors.entities';
import { BAQuery } from '@/lib/ba-query';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { BASessionQuery } from '@/lib/ba-session-query';

export async function getUniqueVisitors(siteQuery: BASiteQuery): Promise<DailyUniqueVisitorsRow[]> {
  const { siteId, queryFilters, granularity, timezone, startDateTime, endDateTime } = siteQuery;
  const { fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    granularity,
    timezone,
    startDateTime,
    endDateTime,
  );

  const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
    ['visitor_id', 'session_created_at'],
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
  );

  const query = timeWrapper(
    safeSql`
        WITH first_visitor_appearances AS (
          SELECT
            visitor_id,
            min(session_created_at) as custom_date
          FROM ${sessionSubQuery}
          GROUP BY visitor_id
        )
        SELECT
          ${granularityFunc('custom_date')} as date,
          uniq(visitor_id) as unique_visitors
        FROM first_visitor_appearances
        GROUP BY date
        ORDER BY date ASC ${fill}
        LIMIT 10080
      `,
  );

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
      },
    })
    .toPromise()) as any[];
  return result.map((row) => DailyUniqueVisitorsRowSchema.parse(row));
}

export async function getTotalUniqueVisitors(siteQuery: BASiteQuery): Promise<number> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteQuery.siteId, startDateTime, endDateTime);

  const queryResponse = safeSql`
    SELECT uniq(visitor_id) * any(_sample_factor) as unique_visitors
    FROM analytics.events ${sample}
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(filters)}
  `;

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
  return Number(result[0]?.unique_visitors ?? 0);
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
