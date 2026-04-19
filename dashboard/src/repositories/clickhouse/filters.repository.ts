import { clickhouse } from '@/lib/clickhouse';
import { type TableFilterColumn } from '@/entities/analytics/filter.entities';
import { safeSql, SQL } from '@/lib/safe-sql';
import { filterColumnSql } from '@/lib/filter-sql';
import { BAQuery } from '@/lib/ba-query';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getFilterDistinctValues(
  siteQuery: BASiteQuery,
  column: TableFilterColumn,
  limit: number = 50,
  search?: string,
): Promise<string[]> {
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const columnSql = filterColumnSql(column);
  const selectExpr = column === 'event_type' ? safeSql`toString(${columnSql})` : columnSql;

  const searchClause =
    search && search.trim()
      ? safeSql`AND ${columnSql} ILIKE ${SQL.String({ search: `%${search.trim()}%` })}`
      : safeSql``;

  const query = safeSql`
    SELECT DISTINCT ${selectExpr} AS value
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      ${searchClause}
      AND value != ''
    LIMIT {limit:UInt32}
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime, limit },
    })
    .toPromise()) as Array<{ value: string }>;

  return rows.map((r) => r.value);
}

export async function getGlobalPropertyKeys(
  siteQuery: BASiteQuery,
  search?: string,
  limit: number = 50,
): Promise<string[]> {
  const { siteId, startDateTime, endDateTime } = siteQuery;
  const { sample } = await BAQuery.getSampling(siteId, startDateTime, endDateTime);

  const searchClause =
    search && search.trim()
      ? safeSql`HAVING key ILIKE ${SQL.String({ search: `%${search.trim()}%` })}`
      : safeSql``;

  const query = safeSql`
    SELECT arrayJoin(global_properties_keys) AS key
    FROM analytics.events ${sample}
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND notEmpty(global_properties_keys)
    GROUP BY key
    ${searchClause}
    ORDER BY key
    LIMIT {limit:UInt32}
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime, limit },
    })
    .toPromise()) as Array<{ key: string }>;

  return rows.map((r) => r.key);
}

export async function getGlobalPropertyValues(
  siteQuery: BASiteQuery,
  propertyKey: string,
  search?: string,
  limit: number = 50,
): Promise<string[]> {
  const { siteId, startDateTime, endDateTime } = siteQuery;

  const searchClause =
    search && search.trim()
      ? safeSql`AND value ILIKE ${SQL.String({ search: `%${search.trim()}%` })}`
      : safeSql``;

  const query = safeSql`
    SELECT DISTINCT global_properties_values[indexOf(global_properties_keys, ${SQL.String({ prop_key: propertyKey })})] AS value
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND has(global_properties_keys, ${SQL.String({ prop_key_filter: propertyKey })})
      AND value != ''
      ${searchClause}
    LIMIT {limit:UInt32}
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDateTime, end: endDateTime, limit },
    })
    .toPromise()) as Array<{ value: string }>;

  return rows.map((r) => r.value);
}
