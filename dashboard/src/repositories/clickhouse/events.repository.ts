import { clickhouse } from '@/lib/clickhouse';
import {
  EventTypeRow,
  EventOccurrenceAggregate,
  RawEventPropertyData,
  RawEventPropertyDataArraySchema,
} from '@/entities/analytics/events.entities';
import { safeSql, SQL } from '@/lib/safe-sql';
import { EventLogCursor, EventLogEntry, EventLogEntrySchema } from '@/entities/analytics/events.entities';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { BAQuery } from '@/lib/ba-query';
import { parseClickHouseDate } from '@/utils/dateHelpers';
import { toDateTimeString } from '@/utils/dateFormatters';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getCustomEventsOverview(siteQuery: BASiteQuery, limit: number): Promise<EventTypeRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteId, startDateTime, endDateTime);

  const query = safeSql`
    SELECT
      custom_event_name as event_name,
      count() * any(_sample_factor) as count,
      uniq(visitor_id) * any(_sample_factor) as unique_users,
      max(timestamp) as last_seen,
      round(count() / uniq(visitor_id), 2) as avg_per_user
    FROM analytics.events ${sample}
    WHERE
          site_id = {site_id:String}
      AND event_type = 'custom'
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND ${SQL.AND(filters)}
    GROUP BY event_name
    ORDER BY count DESC
    LIMIT {limit:UInt32}
  `;
  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDateTime,
        end_date: endDateTime,
        limit,
      },
    })
    .toPromise()) as any[];

  return result.map((row) =>
    EventOccurrenceAggregate.parse({
      ...row,
      last_seen: parseClickHouseDate(row.last_seen),
    }),
  );
}

export async function getEventPropertyData(
  siteQuery: BASiteQuery,
  eventName: string,
): Promise<RawEventPropertyData[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const eventsQuery = safeSql`
    SELECT custom_event_json
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND event_type = 'custom'
      AND custom_event_name = {event_name:String}
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND custom_event_json != '{}'
      AND custom_event_json != ''
      AND ${SQL.AND(filters)}
    LIMIT 10000
  `;

  const eventsResult = (await clickhouse
    .query(eventsQuery.taggedSql, {
      params: {
        ...eventsQuery.taggedParams,
        site_id: siteId,
        event_name: eventName,
        start_date: startDateTime,
        end_date: endDateTime,
      },
    })
    .toPromise()) as Array<{ custom_event_json: string }>;

  return RawEventPropertyDataArraySchema.parse(eventsResult);
}

export async function getRecentEvents(
  siteId: string,
  queryFilters: QueryFilter[],
  limit: number,
  cursor: EventLogCursor | null,
): Promise<EventLogEntry[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);
  // The cursor bounds the upper edge so new arrivals can't shift already-loaded pages.
  const cursorClause = cursor ? safeSql`timestamp <= {cursor_ts:DateTime}` : safeSql`1 = 1`;

  const query = safeSql`
    SELECT
      timestamp,
      custom_event_name as event_name,
      toString(visitor_id) as visitor_id,
      url,
      custom_event_json,
      country_code,
      device_type,
      browser
    FROM analytics.events
    WHERE
          site_id = {site_id:String}
      AND event_type = 'custom'
      AND ${cursorClause}
      AND ${SQL.AND(filters)}
    ORDER BY timestamp DESC, visitor_id, custom_event_name, url,
             custom_event_json, country_code, device_type, browser
    LIMIT {limit:UInt32}
    OFFSET {offset:UInt32}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        limit,
        offset: cursor?.skip ?? 0,
        ...(cursor ? { cursor_ts: toDateTimeString(cursor.timestamp) } : {}),
      },
    })
    .toPromise()) as any[];

  return result.map((row) => EventLogEntrySchema.parse({ ...row, timestamp: parseClickHouseDate(row.timestamp) }));
}

export async function getEventsSince(
  siteId: string,
  queryFilters: QueryFilter[],
  since: Date,
  limit: number,
): Promise<EventLogEntry[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      timestamp,
      custom_event_name as event_name,
      toString(visitor_id) as visitor_id,
      url,
      custom_event_json,
      country_code,
      device_type,
      browser
    FROM analytics.events
    WHERE
          site_id = {site_id:String}
      AND event_type = 'custom'
      AND timestamp >= {since:DateTime}
      AND ${SQL.AND(filters)}
    ORDER BY timestamp DESC, visitor_id, custom_event_name, url,
             custom_event_json, country_code, device_type, browser
    LIMIT {limit:UInt32}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        since: toDateTimeString(since),
        limit,
      },
    })
    .toPromise()) as any[];

  return result.map((row) => EventLogEntrySchema.parse({ ...row, timestamp: parseClickHouseDate(row.timestamp) }));
}

export async function getTotalEventCount(siteId: string, queryFilters: QueryFilter[]): Promise<number> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT count() as total
    FROM analytics.events
    WHERE
          site_id = {site_id:String}
      AND event_type = 'custom'
      AND ${SQL.AND(filters)}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId },
    })
    .toPromise()) as Array<{ total: number }>;

  return result[0]?.total || 0;
}

export async function anySiteHasEventsWithinDays(siteIds: string[], withinDays: number): Promise<boolean> {
  if (siteIds.length === 0) return false;

  const query = safeSql`
    SELECT 1
    FROM analytics.events
    WHERE site_id IN ({site_ids:Array(String)})
      AND timestamp > now() - INTERVAL {within_days:UInt32} DAY
    LIMIT 1
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_ids: siteIds, within_days: withinDays },
    })
    .toPromise()) as Array<unknown>;

  return result.length > 0;
}
