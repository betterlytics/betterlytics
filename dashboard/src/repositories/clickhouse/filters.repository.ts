import { clickhouse } from '@/lib/clickhouse';
import { type TableFilterColumn } from '@/entities/analytics/filter.entities';
import { type PropertySourceKind } from '@/entities/analytics/propertySources';
import { safeSql, SQL } from '@/lib/safe-sql';
import { filterColumnSql } from '@/lib/filter-sql';
import { PROPERTY_SQL } from '@/lib/property-source-sql';
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

export async function getPropertyKeys(
  siteQuery: BASiteQuery,
  source: PropertySourceKind,
  search?: string,
  limit: number = 50,
): Promise<string[]> {
  const { siteId, startDateTime, endDateTime } = siteQuery;
  const { sample } = await BAQuery.getSampling(siteId, startDateTime, endDateTime);
  const { keysSelectExpr, hasAnyKey, eventScopeClause } = PROPERTY_SQL[source].discovery;

  const searchClause =
    search && search.trim()
      ? safeSql`HAVING key ILIKE ${SQL.String({ search: `%${search.trim()}%` })}`
      : safeSql``;

  const query = safeSql`
    SELECT ${keysSelectExpr} AS key
    FROM analytics.events ${sample}
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${hasAnyKey}
      ${eventScopeClause}
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

export async function getPropertyValues(
  siteQuery: BASiteQuery,
  source: PropertySourceKind,
  propertyKey: string,
  search?: string,
  limit: number = 50,
): Promise<string[]> {
  const { siteId, startDateTime, endDateTime } = siteQuery;
  const { sql, discovery } = PROPERTY_SQL[source];

  const sample = discovery.sampleValues
    ? (await BAQuery.getSampling(siteId, startDateTime, endDateTime)).sample
    : safeSql``;

  const valueExpr = sql.extractValue(SQL.String({ prop_key: propertyKey }));
  const hasKeyExpr = sql.hasKey(SQL.String({ prop_key_filter: propertyKey }));

  const searchClause =
    search && search.trim()
      ? safeSql`AND value ILIKE ${SQL.String({ search: `%${search.trim()}%` })}`
      : safeSql``;

  const query = safeSql`
    SELECT DISTINCT ${valueExpr} AS value
    FROM analytics.events ${sample}
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${hasKeyExpr}
      ${discovery.eventScopeClause}
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
