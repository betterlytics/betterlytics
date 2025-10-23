import { clickhouse } from '@/lib/clickhouse';
import { BAQuery } from '@/lib/ba-query';
import { QueryFilter, FilterColumn } from '@/entities/filter';
import { DateTimeString } from '@/types/dates';
import { safeSql, SQL } from '@/lib/safe-sql';

export async function getFilterDistinctValues(params: {
  siteId: string;
  startDate: DateTimeString;
  endDate: DateTimeString;
  column: FilterColumn;
  limit?: number;
  search?: string;
}): Promise<string[]> {
  const { siteId, startDate, endDate, column, limit = 50, search } = params;

  const selectExpr =
    column === 'event_type' ? safeSql`toString(${SQL.Unsafe(column)})` : safeSql`${SQL.Unsafe(column)}`;

  const searchClause =
    search && search.trim()
      ? safeSql`AND ${SQL.Unsafe(column)} ILIKE ${SQL.String({ search: `%${search.trim()}%` })}`
      : safeSql``;

  const query = safeSql`
    SELECT ${selectExpr} AS value, uniq(visitor_id) AS visitors
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      ${searchClause}
      AND ${SQL.Unsafe(column)} != ''
    GROUP BY value
    ORDER BY visitors DESC
    LIMIT {limit:UInt32}
  `;

  const rows = (await clickhouse
    .query(query.taggedSql, {
      params: { ...query.taggedParams, site_id: siteId, start: startDate, end: endDate, limit },
    })
    .toPromise()) as Array<{ value: string }>;

  return rows.map((r) => r.value);
}

