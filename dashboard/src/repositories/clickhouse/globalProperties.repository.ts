import { clickhouse } from '@/lib/clickhouse';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export type GlobalPropertyKeyValueRow = {
  property_key: string;
  value: string;
  count: number;
};

export async function getGlobalPropertiesKeyValueCounts(
  siteQuery: BASiteQuery,
  limit: number = 500,
): Promise<GlobalPropertyKeyValueRow[]> {
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
      AND length(global_properties_keys) > 0
      AND ${SQL.AND(filters)}
      AND value != ''
    GROUP BY property_key, value
    ORDER BY count DESC
    LIMIT {limit:UInt32}
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
        start: startDateTime,
        end: endDateTime,
        limit,
      },
    })
    .toPromise()) as GlobalPropertyKeyValueRow[];

  return rows.map((row) => ({
    property_key: row.property_key,
    value: row.value,
    count: Math.round(Number(row.count)),
  }));
}
