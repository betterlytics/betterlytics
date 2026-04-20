import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export type GlobalPropertyKeyCountRow = {
  property_key: string;
  count: number;
};

export type GlobalPropertyKeyValueRow = {
  property_key: string;
  value: string;
  count: number;
};

export async function getTopGlobalPropertyKeys(
  siteQuery: BASiteQuery,
  keyLimit: number,
): Promise<GlobalPropertyKeyCountRow[]> {
  const { siteId, queryFilters, startDateTime, endDateTime } = siteQuery;
  const filters = BAQuery.getFilterQuery(queryFilters);
  const { sample } = await BAQuery.getSampling(siteId, startDateTime, endDateTime);

  const query = safeSql`
    SELECT
      property_key,
      count() * any(_sample_factor) AS count
    FROM analytics.events ${sample}
    ARRAY JOIN global_properties_keys AS property_key
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND length(global_properties_keys) > 0
      AND ${SQL.AND(filters)}
    GROUP BY property_key
    ORDER BY count DESC
    LIMIT {key_limit:UInt32}
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        key_limit: keyLimit,
      },
    })
    .toPromise()) as GlobalPropertyKeyCountRow[];

  return rows.map((row) => ({
    property_key: row.property_key,
    count: Math.round(Number(row.count)),
  }));
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
  const { sample } = await BAQuery.getSampling(siteId, startDateTime, endDateTime);

  const query = safeSql`
    SELECT
      property_key,
      value,
      count() * any(_sample_factor) AS count
    FROM analytics.events ${sample}
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
    ORDER BY count DESC
    LIMIT {value_limit:UInt32} BY property_key
  `;

  const rows = (await clickhouse
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
    .toPromise()) as GlobalPropertyKeyValueRow[];

  return rows.map((row) => ({
    property_key: row.property_key,
    value: row.value,
    count: Math.round(Number(row.count)),
  }));
}
