import { z } from 'zod';
import { FILTER_COLUMNS, type TableFilterColumn } from '@/entities/analytics/filter.entities';
import { SQL, safeSql, type SQLTaggedExpression } from './safe-sql';

const TABLE_COLUMN_SCHEMA = z.enum(FILTER_COLUMNS);

const FILTER_COLUMN_SQL_OVERRIDES: Partial<Record<TableFilterColumn, ReturnType<typeof safeSql>>> = {
  referrer_source: safeSql`referrer_source_effective`,
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
  return FILTER_COLUMN_SQL_OVERRIDES[parsed] ?? SQL.Unsafe(parsed);
}

export function filterColumnSqlForSession(col: TableFilterColumn, tupleColumns: readonly string[]) {
  const parsed = TABLE_COLUMN_SCHEMA.parse(col);
  const sql = filterColumnSql(parsed);
  const isTuple = !FILTER_COLUMN_SQL_OVERRIDES[parsed] && tupleColumns.includes(parsed);

  return isTuple ? safeSql`${sql}.2` : sql;
}

/**
 * A lone bare wildcard (`*`, or `%` in builders that transform patterns before
 * checking) means "match any value". ClickHouse evaluates `'' ILIKE '%'` as
 * true, so pattern matching would also match rows where the column is unset -
 * builders special-case such filters into a presence check instead.
 */
export function isMatchAnyValueFilter(values: string[]) {
  return values.length === 1 && (values[0] === '*' || values[0] === '%');
}

/**
 * Presence check for a bare wildcard filter: `= *` keeps rows where the value
 * is set, `!= *` keeps rows where it is absent. Returns null when the filter
 * is not a bare wildcard, or for `event_type` - it is an Enum8, so comparing
 * it to '' throws, and it is never unset anyway.
 */
export function matchAnyValueFilterSql(
  values: string[],
  operator: '=' | '!=',
  column: SQLTaggedExpression,
  col?: TableFilterColumn,
): SQLTaggedExpression | null {
  if (!isMatchAnyValueFilter(values) || col === 'event_type') {
    return null;
  }
  return operator === '=' ? safeSql`${column} != ''` : safeSql`${column} = ''`;
}
