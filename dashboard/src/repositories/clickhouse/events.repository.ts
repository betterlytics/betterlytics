import { clickhouse } from '@/lib/clickhouse';
import { DateTimeString } from '@/types/dates';
import {
  EventTypeRow,
  EventOccurrenceAggregate,
  RawEventPropertyData,
  RawEventPropertyDataArraySchema,
  EventLogEntry,
  EventLogEntrySchema,
  EVENT_LOG_SORT_FIELD_TO_COLUMN,
  type EventLogSortConfig,
} from '@/entities/analytics/events.entities';
import { safeSql, SQL } from '@/lib/safe-sql';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { BAQuery } from '@/lib/ba-query';
import { parseClickHouseDate } from '@/utils/dateHelpers';
import { withCursorPagination } from '@/lib/cursor-pagination';
import type { CursorData } from '@/entities/pagination.entities';

export async function getCustomEventsOverview(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<EventTypeRow[]> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      custom_event_name as event_name,
      count() as count,
      uniq(visitor_id) as unique_users,
      max(timestamp) as last_seen,
      round(count() / uniq(visitor_id), 2) as avg_per_user
    FROM analytics.events
    WHERE
          site_id = {site_id:String}
      AND event_type = 'custom' 
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND ${SQL.AND(filters)}
    GROUP BY event_name
    ORDER BY count DESC
    LIMIT 100
  `;
  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDate,
        end_date: endDate,
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
  siteId: string,
  eventName: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<RawEventPropertyData[]> {
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
        start_date: startDate,
        end_date: endDate,
      },
    })
    .toPromise()) as Array<{ custom_event_json: string }>;

  return RawEventPropertyDataArraySchema.parse(eventsResult);
}

export async function getRecentEvents(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  limit: number = 50,
  offset: number = 0,
  queryFilters?: QueryFilter[],
): Promise<EventLogEntry[]> {
  const filters = BAQuery.getFilterQuery(queryFilters || []);

  const query = safeSql`
    SELECT
      timestamp,
      custom_event_name as event_name,
      visitor_id,
      url,
      custom_event_json,
      country_code,
      device_type,
      browser
    FROM analytics.events
    WHERE
          site_id = {site_id:String}
      AND event_type = 'custom'
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND ${SQL.AND(filters)}
    ORDER BY timestamp DESC
    LIMIT {limit:UInt32}
    OFFSET {offset:UInt32}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDate,
        end_date: endDate,
        limit,
        offset,
      },
    })
    .toPromise()) as any[];

  return result.map((row) => EventLogEntrySchema.parse({ ...row, timestamp: parseClickHouseDate(row.timestamp) }));
}

/**
 * Get paginated recent events using cursor-based pagination.
 *
 * @param siteId - The site ID to query
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param sortConfig - Sort configuration defining field ordering
 * @param cursor - Cursor data for pagination (null for first page)
 * @param limit - Maximum number of items to return
 * @param queryFilters - Optional query filters
 */
export async function getRecentEventsCursor(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  sortConfig: EventLogSortConfig,
  cursor: CursorData | null,
  limit: number,
  queryFilters?: QueryFilter[],
): Promise<EventLogEntry[]> {
  const filters = BAQuery.getFilterQuery(queryFilters || []);

  const baseQuery = safeSql`
    SELECT
      timestamp,
      custom_event_name as event_name,
      visitor_id,
      url,
      custom_event_json,
      country_code,
      device_type,
      browser
    FROM analytics.events
    WHERE
          site_id = {site_id:String}
      AND event_type = 'custom'
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND ${SQL.AND(filters)}
  `;

  const query = withCursorPagination({
    baseQuery,
    cursor,
    sortConfig,
    fieldToColumn: EVENT_LOG_SORT_FIELD_TO_COLUMN,
    limit,
  });

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDate,
        end_date: endDate,
      },
    })
    .toPromise()) as any[];

  return result.map((row) => EventLogEntrySchema.parse({ ...row, timestamp: parseClickHouseDate(row.timestamp) }));
}

export async function getTotalEventCount(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  queryFilters: QueryFilter[],
): Promise<number> {
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT count() as total
    FROM analytics.events
    WHERE
          site_id = {site_id:String}
      AND event_type = 'custom'
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
      AND ${SQL.AND(filters)}
  `;

  const result = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start_date: startDate,
        end_date: endDate,
      },
    })
    .toPromise()) as Array<{ total: number }>;

  return result[0]?.total || 0;
}
