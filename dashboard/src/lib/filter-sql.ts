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

/** Escapes the ILIKE metacharacters `\`, `%` and `_` so the text matches literally. */
export function escapeLikePattern(text: string) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Turns a typed filter value into an ILIKE pattern: `*` is the only wildcard and
 * every other character matches literally. Escaping has to run before `*` becomes
 * `%`, or it would escape our own wildcard.
 */
export function filterValueToLikePattern(value: string) {
  return escapeLikePattern(value).replaceAll('*', '%');
}

/**
 * A lone `%` pattern, which only a bare typed `*` produces, means "match any
 * value". ClickHouse evaluates `'' ILIKE '%'` as true, so pattern matching would
 * also match rows where the column is unset - builders special-case such filters
 * into a presence check instead.
 */
export function isMatchAnyValueFilter(patterns: string[]) {
  return patterns.length === 1 && patterns[0] === '%';
}

/**
 * Presence check for a bare wildcard filter: `= *` keeps rows where the value
 * is set, `!= *` keeps rows where it is absent. Returns null when the filter
 * is not a bare wildcard, or for `event_type` - it is an Enum8, so comparing
 * it to '' throws, and it is never unset anyway.
 */
export function matchAnyValueFilterSql(
  patterns: string[],
  operator: '=' | '!=',
  column: SQLTaggedExpression,
  col?: TableFilterColumn,
): SQLTaggedExpression | null {
  if (!isMatchAnyValueFilter(patterns) || col === 'event_type') {
    return null;
  }
  return operator === '=' ? safeSql`${column} != ''` : safeSql`${column} = ''`;
}
