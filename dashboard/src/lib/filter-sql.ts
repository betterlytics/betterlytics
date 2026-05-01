import { z } from 'zod';
import { FILTER_COLUMNS, type TableFilterColumn } from '@/entities/analytics/filter.entities';
import { SQL } from './safe-sql';

const TABLE_COLUMN_SCHEMA = z.enum(FILTER_COLUMNS);

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
  return SQL.Unsafe(TABLE_COLUMN_SCHEMA.parse(col));
}
