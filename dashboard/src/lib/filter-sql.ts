import { z } from 'zod';
import { FILTER_COLUMNS, type TableFilterColumn } from '@/entities/analytics/filter.entities';
import { SQL, safeSql } from './safe-sql';

const TABLE_COLUMN_SCHEMA = z.enum(FILTER_COLUMNS);

const FILTER_COLUMN_SQL_OVERRIDES: Partial<Record<TableFilterColumn, string>> = {
  referrer_source: 'referrer_source_effective',
};

/**
 * Inject a known-safe column identifier into raw SQL.
 *
 * Only standard filter columns are accepted — the wider FilterColumn union
 * (which includes `gp.${string}`) is rejected at the type level. An additional
 * runtime zod parse catches any `as`-cast or mistyped input as defense-in-depth.
 *
 * Any identifier that reaches raw SQL should go through this function. Direct
 * `SQL.Unsafe(column)` usage for filter columns is a code-review red flag.
 */
export function filterColumnSql(col: TableFilterColumn) {
  const parsed = TABLE_COLUMN_SCHEMA.parse(col);
  return SQL.Unsafe(FILTER_COLUMN_SQL_OVERRIDES[parsed] ?? parsed);
}

export function filterColumnSqlForSession(col: TableFilterColumn, tupleColumns: readonly string[]) {
  const parsed = TABLE_COLUMN_SCHEMA.parse(col);
  const sql = filterColumnSql(parsed);
  const isTuple = !FILTER_COLUMN_SQL_OVERRIDES[parsed] && tupleColumns.includes(parsed);

  return isTuple ? safeSql`${sql}.2` : sql;
}
