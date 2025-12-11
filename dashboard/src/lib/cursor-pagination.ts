'server only';

import { z } from 'zod';
import { safeSql, SQL } from './safe-sql';
import { CursorData, CursorDataSchema, SortConfig, SortDirection } from '@/entities/pagination.entities';

/**
 * Encode cursor data to a URL-safe base64 string
 */
export function encodeCursor(data: CursorData): string {
  const json = JSON.stringify(data);
  return Buffer.from(json, 'utf-8').toString('base64url');
}

/**
 * Decode a cursor string back to cursor data
 * Returns null if the cursor is invalid
 */
export function decodeCursor(encoded: string | null): CursorData | null {
  if (!encoded) return null;

  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json);
    return CursorDataSchema.parse(parsed);
  } catch {
    // Invalid cursor - return null to start from beginning
    return null;
  }
}

/**
 * Type definition for field-to-column mapping
 * Maps frontend sort field names to SQL column expressions
 */
export type FieldToColumnMap<TField extends string> = Record<TField, string>;

/**
 * Type definition for field-to-cursor-key mapping
 * Maps frontend sort field names to the keys used in cursor data (which match raw DB result keys)
 */
export type FieldToCursorKeyMap<TField extends string, TRawKey extends string> = Record<TField, TRawKey>;

/**
 * Build the WHERE clause for cursor-based pagination
 *
 * For multi-field sorting with mixed directions, we need compound conditions.
 * Example: ORDER BY visitors DESC, name ASC
 * To get rows "after" cursor (visitors=100, name='foo'):
 *   WHERE (visitors < 100) OR (visitors = 100 AND name > 'foo')
 *
 * This handles arbitrary number of sort fields with mixed ASC/DESC.
 */
export function buildCursorWhereClause<TField extends string>(
  cursor: CursorData | null,
  sortConfig: SortConfig<TField>,
  fieldToColumn: FieldToColumnMap<TField>,
): ReturnType<typeof safeSql> {
  // No cursor = first page, no WHERE condition needed
  if (!cursor || sortConfig.fields.length === 0) {
    return safeSql`1=1`;
  }

  const conditions: ReturnType<typeof safeSql>[] = [];

  // Build compound OR conditions for each "break point"
  // For n sort fields, we get n OR conditions
  for (let i = 0; i < sortConfig.fields.length; i++) {
    const equalityConditions: ReturnType<typeof safeSql>[] = [];
    const finalCondition: ReturnType<typeof safeSql>[] = [];

    // All fields before index i must be equal
    for (let j = 0; j < i; j++) {
      const field = sortConfig.fields[j];
      const column = fieldToColumn[field.field];
      const cursorValue = cursor[field.field];

      if (cursorValue === undefined) {
        // Missing cursor value - skip this condition branch
        continue;
      }

      equalityConditions.push(buildEqualityCondition(column, cursorValue, j));
    }

    // Field at index i uses < or > based on sort direction
    const currentField = sortConfig.fields[i];
    const currentColumn = fieldToColumn[currentField.field];
    const currentCursorValue = cursor[currentField.field];

    if (currentCursorValue === undefined) {
      // Missing cursor value for this field - skip
      continue;
    }

    finalCondition.push(buildComparisonCondition(currentColumn, currentCursorValue, currentField.direction, i));

    // Combine: (field0 = val0 AND field1 = val1 AND ... AND fieldI < valI)
    const allConditions = [...equalityConditions, ...finalCondition];

    if (allConditions.length > 0) {
      conditions.push(safeSql`(${SQL.AND(allConditions)})`);
    }
  }

  if (conditions.length === 0) {
    return safeSql`1=1`;
  }

  // Combine all condition groups with OR
  return safeSql`(${SQL.OR(conditions)})`;
}

/**
 * Build an equality condition: column = value
 */
function buildEqualityCondition(
  column: string,
  value: string | number,
  paramIndex: number,
): ReturnType<typeof safeSql> {
  if (typeof value === 'string') {
    return safeSql`${SQL.Unsafe(column)} = ${SQL.String({ [`cursor_eq_${paramIndex}`]: value })}`;
  }
  return safeSql`${SQL.Unsafe(column)} = ${SQL.UInt32({ [`cursor_eq_${paramIndex}`]: value })}`;
}

/**
 * Build a comparison condition: column < value OR column > value
 * Direction determines the comparison operator:
 * - 'desc': use < (we want rows with smaller values = "after" in DESC order)
 * - 'asc': use > (we want rows with larger values = "after" in ASC order)
 */
function buildComparisonCondition(
  column: string,
  value: string | number,
  direction: SortDirection,
  paramIndex: number,
): ReturnType<typeof safeSql> {
  const operator = direction === 'desc' ? '<' : '>';

  if (typeof value === 'string') {
    return safeSql`${SQL.Unsafe(column)} ${SQL.Unsafe(operator)} ${SQL.String({ [`cursor_cmp_${paramIndex}`]: value })}`;
  }
  return safeSql`${SQL.Unsafe(column)} ${SQL.Unsafe(operator)} ${SQL.UInt32({ [`cursor_cmp_${paramIndex}`]: value })}`;
}

/**
 * Build the ORDER BY clause from sort configuration
 */
export function buildOrderByClause<TField extends string>(
  sortConfig: SortConfig<TField>,
  fieldToColumn: FieldToColumnMap<TField>,
): ReturnType<typeof safeSql> {
  if (sortConfig.fields.length === 0) {
    return safeSql``;
  }

  const orderParts = sortConfig.fields.map((field) => {
    const column = fieldToColumn[field.field];
    const direction = field.direction.toUpperCase();
    return safeSql`${SQL.Unsafe(column)} ${SQL.Unsafe(direction)}`;
  });

  return safeSql`ORDER BY ${SQL.SEPARATOR(orderParts)}`;
}

/**
 * Extract cursor data from the last item in a result set
 * Uses the sort configuration to determine which fields to include
 *
 * @param item The raw database row (last item in results)
 * @param sortConfig The sort configuration
 * @param fieldToCursorKey Maps sort field names to the keys in the raw item
 */
export function extractCursorFromItem<TField extends string, TItem extends Record<string, unknown>>(
  item: TItem,
  sortConfig: SortConfig<TField>,
  fieldToCursorKey: Record<TField, keyof TItem>,
): CursorData {
  const cursor: CursorData = {};

  for (const sortField of sortConfig.fields) {
    const itemKey = fieldToCursorKey[sortField.field];
    const value = item[itemKey];

    if (typeof value === 'string' || typeof value === 'number') {
      cursor[sortField.field] = value;
    }
  }

  return cursor;
}

/**
 * Schema for validating limit parameter
 */
export const LimitSchema = z.number().int().positive().max(100).default(10);

/**
 * Options for withCursorPagination
 */
export type WithCursorPaginationOptions<TField extends string> = {
  /** The base query that produces rows to paginate */
  baseQuery: ReturnType<typeof safeSql>;
  /** Decoded cursor data (null for first page) */
  cursor: CursorData | null;
  /** Sort configuration defining field ordering */
  sortConfig: SortConfig<TField>;
  /** Maps sort field names to SQL column names in the base query output */
  fieldToColumn: FieldToColumnMap<TField>;
  /** Number of items to fetch (will automatically fetch limit+1 for hasMore detection) */
  limit: number;
};

/**
 * Wraps a base query with cursor-based pagination.
 *
 * This helper wraps any query in a CTE and applies cursor filtering, ordering, and limiting.
 * The base query should produce the rows you want to paginate - it can be a simple SELECT
 * or a complex aggregation. The cursor condition is applied AFTER the base query executes.
 *
 * @example
 * ```ts
 * const baseQuery = safeSql`
 *   SELECT utm_campaign, COUNT(*) as visitors
 *   FROM events
 *   WHERE site_id = {siteId:String}
 *   GROUP BY utm_campaign
 * `;
 *
 * const query = withCursorPagination({
 *   baseQuery,
 *   cursor: decodeCursor(cursorString),
 *   sortConfig: { fields: [{ field: 'visitors', direction: 'desc' }] },
 *   fieldToColumn: { visitors: 'visitors' },
 *   limit: 10,
 * });
 * ```
 */
export function withCursorPagination<TField extends string>({
  baseQuery,
  cursor,
  sortConfig,
  fieldToColumn,
  limit,
}: WithCursorPaginationOptions<TField>): ReturnType<typeof safeSql> {
  const cursorCondition = buildCursorWhereClause(cursor, sortConfig, fieldToColumn);
  const orderBy = buildOrderByClause(sortConfig, fieldToColumn);

  return safeSql`
    WITH base AS (${baseQuery})
    SELECT * FROM base
    WHERE ${cursorCondition}
    ${orderBy}
    LIMIT ${SQL.UInt32({ limit: limit + 1 })}
  `;
}

/**
 * Create a cursor-paginated response from query results
 *
 * @param items The query results
 * @param limit The requested limit
 * @param sortConfig The sort configuration
 * @param fieldToCursorKey Maps sort fields to raw item keys for cursor extraction
 */
export function createCursorPaginatedResponse<TField extends string, TItem extends Record<string, unknown>>(
  items: TItem[],
  limit: number,
  sortConfig: SortConfig<TField>,
  fieldToCursorKey: Record<TField, keyof TItem>,
): { items: TItem[]; nextCursor: string | null; hasMore: boolean } {
  // We query limit + 1 to check if there are more results
  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;

  let nextCursor: string | null = null;
  if (hasMore && resultItems.length > 0) {
    const lastItem = resultItems[resultItems.length - 1];
    const cursorData = extractCursorFromItem(lastItem, sortConfig, fieldToCursorKey);
    nextCursor = encodeCursor(cursorData);
  }

  return {
    items: resultItems,
    nextCursor,
    hasMore,
  };
}
