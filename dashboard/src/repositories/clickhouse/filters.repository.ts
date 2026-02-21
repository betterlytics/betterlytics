import { clickhouse } from '@/lib/clickhouse';
import { type FilterColumn } from '@/entities/analytics/filter.entities';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getFilterDistinctValues(
  siteQuery: BASiteQuery,
  column: FilterColumn,
  limit: number = 50,
  search?: string,
): Promise<string[]> {
  const { siteId } = siteQuery;
  const { startDateTime: startDate, endDateTime: endDate } = siteQuery;

  const selectExpr =
    column === 'event_type' ? safeSql`toString(${SQL.Unsafe(column)})` : safeSql`${SQL.Unsafe(column)}`;

  const searchClause =
    search && search.trim()
      ? safeSql`AND ${SQL.Unsafe(column)} ILIKE ${SQL.String({ search: `%${search.trim()}%` })}`
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
      params: { ...query.taggedParams, site_id: siteId, start: startDate, end: endDate, limit },
    })
    .toPromise()) as Array<{ value: string }>;

  return rows.map((r) => r.value);
}
