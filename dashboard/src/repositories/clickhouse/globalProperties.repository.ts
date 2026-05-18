import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import {
  GlobalPropertyKeyCountRow,
  GlobalPropertyKeyCountRowSchema,
  GlobalPropertyKeyValueRow,
  GlobalPropertyKeyValueRowSchema,
  GlobalPropertyEventCountRow,
  GlobalPropertyEventCountRowSchema,
  GlobalPropertyEventValueRow,
  GlobalPropertyEventValueRowSchema,
} from '@/entities/analytics/globalProperties.entities';

export async function getTopGlobalPropertyKeys(
  siteQuery: BASiteQuery,
  keyLimit: number,
): Promise<GlobalPropertyKeyCountRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      property_key,
      uniq(visitor_id) AS visitors
    FROM analytics.events
    ARRAY JOIN global_properties_keys AS property_key
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND length(global_properties_keys) > 0
      AND ${SQL.AND(filters)}
    GROUP BY property_key
    ORDER BY visitors DESC
    LIMIT {key_limit:UInt32}
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        key_limit: keyLimit,
      },
    })
    .toPromise();

  return GlobalPropertyKeyCountRowSchema.array().parse(result);
}

export async function getTopGlobalPropertyValuesForKeys(
  siteQuery: BASiteQuery,
  selectedKeys: string[],
  valueLimit: number,
): Promise<GlobalPropertyKeyValueRow[]> {
  if (selectedKeys.length === 0) {
    return [];
  }

  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      property_key,
      value,
      uniq(visitor_id) AS visitors
    FROM analytics.events
    ARRAY JOIN
      global_properties_keys AS property_key,
      global_properties_values AS value
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND hasAny(global_properties_keys, {selected_keys:Array(String)})
      AND property_key IN {selected_keys:Array(String)}
      AND value != ''
      AND ${SQL.AND(filters)}
    GROUP BY property_key, value
    ORDER BY visitors DESC
    LIMIT {value_limit:UInt32} BY property_key
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        selected_keys: selectedKeys,
        value_limit: valueLimit,
      },
    })
    .toPromise();

  return GlobalPropertyKeyValueRowSchema.array().parse(result);
}

export async function getTopGlobalPropertyKeysForEvent(
  siteQuery: BASiteQuery,
  eventName: string,
  keyLimit: number,
): Promise<GlobalPropertyEventCountRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      property_key,
      count() AS event_count,
      uniqExact(value) AS unique_value_count
    FROM analytics.events
    ARRAY JOIN
      global_properties_keys AS property_key,
      global_properties_values AS value
    WHERE site_id = {site_id:String}
      AND event_type = 'custom'
      AND custom_event_name = {event_name:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND length(global_properties_keys) > 0
      AND value != ''
      AND ${SQL.AND(filters)}
    GROUP BY property_key
    ORDER BY event_count DESC
    LIMIT {key_limit:UInt32}
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        event_name: eventName,
        start: startDateTime,
        end: endDateTime,
        key_limit: keyLimit,
      },
    })
    .toPromise();

  return GlobalPropertyEventCountRowSchema.array().parse(result);
}

export async function getTopGlobalPropertyValuesForEventKeys(
  siteQuery: BASiteQuery,
  eventName: string,
  selectedKeys: string[],
  valueLimit: number,
): Promise<GlobalPropertyEventValueRow[]> {
  if (selectedKeys.length === 0) {
    return [];
  }

  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);

  const query = safeSql`
    SELECT
      property_key,
      value,
      count() AS event_count
    FROM analytics.events
    ARRAY JOIN
      global_properties_keys AS property_key,
      global_properties_values AS value
    WHERE site_id = {site_id:String}
      AND event_type = 'custom'
      AND custom_event_name = {event_name:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND value != ''
      AND property_key IN {selected_keys:Array(String)}
      AND ${SQL.AND(filters)}
    GROUP BY property_key, value
    ORDER BY event_count DESC
    LIMIT {value_limit:UInt32} BY property_key
  `;

  const result = await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        event_name: eventName,
        start: startDateTime,
        end: endDateTime,
        selected_keys: selectedKeys,
        value_limit: valueLimit,
      },
    })
    .toPromise();

  return GlobalPropertyEventValueRowSchema.array().parse(result);
}
