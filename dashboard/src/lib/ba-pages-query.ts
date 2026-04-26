'server only';

import {
  parseFilterColumn,
  QueryFilter,
  QueryFilterSchema,
  type TableFilterColumn,
} from '@/entities/analytics/filter.entities';
import { z } from 'zod';
import { safeSql, SQL } from './safe-sql';
import { DateTimeString } from '@/types/dates';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { BAHourlyQuery } from './ba-hourly-query';

/**
 * Filter columns the `analytics.page_stats` MV can answer natively.
 * Anything else routes to the slow path on `analytics.events` (see §6.4 of the
 * pages-optimization design doc).
 *
 * `url` is the events-table column name; on `page_stats` the same data lives
 * in `path`. The mapping is applied in `mvColumnFor`.
 */
const PAGE_STATS_COMPATIBLE_COLUMNS = new Set<TableFilterColumn>([
  'url',
  'country_code',
  'device_type',
  'browser',
  'os',
]);

/**
 * Columns that exist on `analytics.sessions` (denormalized by the sessions MV)
 * and therefore can be used to filter the merged-sessions CTE used by the
 * fast-path bounce / entry / exit queries. `url` is intentionally excluded —
 * the sessions table only has `entry_page` / `exit_page` tuples, never a
 * generic per-pageview URL.
 */
const SESSIONS_TABLE_COMPATIBLE_COLUMNS = new Set<TableFilterColumn>([
  'country_code',
  'device_type',
  'browser',
  'os',
]);

// MV stores `path` for what the events table calls `url`. Other columns map identically.
function mvColumnFor(col: TableFilterColumn): string {
  return col === 'url' ? 'path' : col;
}

// Same operator + wildcard transform pattern as BASessionQuery / BAQuery.
const INTERNAL_FILTER_OPERATORS = {
  '=': {
    quantifier: safeSql`arrayExists`,
    operater: safeSql`ILIKE`,
  },
  '!=': {
    quantifier: safeSql`arrayAll`,
    operater: safeSql`NOT ILIKE`,
  },
} as const;

const TransformQueryFilterSchema = QueryFilterSchema.transform((filter) => ({
  ...filter,
  rawOperator: filter.operator,
  operator: INTERNAL_FILTER_OPERATORS[filter.operator],
  values: filter.values.map((value) => value.replaceAll('*', '%')),
}));

type TransformedFilter = z.infer<typeof TransformQueryFilterSchema>;

/**
 * Decide whether the `page_stats` MV can serve this query, or whether the slow
 * path on raw events is required.
 *
 * Fast path requires:
 *   1. Hour-aligned date range (granularity ≥ hour, start on hour boundary).
 *   2. Every filter is a `standard` (non-gp) filter whose column is
 *      denormalized on `page_stats`.
 */
function canUseMv(siteQuery: BASiteQuery): boolean {
  if (!BAHourlyQuery.canUseHourlyMVBoundaries(siteQuery)) return false;

  return siteQuery.queryFilters.every((f) => {
    const parsed = parseFilterColumn(f.column);
    return parsed.kind === 'standard' && PAGE_STATS_COMPATIBLE_COLUMNS.has(parsed.col);
  });
}

function nonEmptyFilters(queryFilters: QueryFilter[]): QueryFilter[] {
  return queryFilters.filter(
    (filter) =>
      Boolean(filter.column) && Boolean(filter.operator) && filter.values.every((value) => Boolean(value)),
  );
}

/**
 * Build the filter WHERE-clause fragments for the FAST path against the
 * `analytics.page_stats` MV. Caller wraps the result with `SQL.AND(...)`.
 *
 * Returns `[safeSql\`1=1\`]` when there are no usable filters so the caller
 * can always splice the result into a `WHERE ... AND ${SQL.AND(...)}` clause
 * without conditional branches.
 *
 * Throws if a non-MV-compatible filter sneaks through. `canUseMv` is meant to
 * gate the fast path before this is called — the throw is defensive.
 */
function getPageStatsFilters(queryFilters: QueryFilter[]) {
  const filtered = nonEmptyFilters(queryFilters);
  const transformed = TransformQueryFilterSchema.array().parse(filtered);
  if (transformed.length === 0) return [safeSql`1=1`];

  return transformed.map((filter, index) => {
    const parsed = parseFilterColumn(filter.column);
    if (parsed.kind !== 'standard' || !PAGE_STATS_COMPATIBLE_COLUMNS.has(parsed.col)) {
      throw new Error(
        `BAPageQuery.getPageStatsFilters: filter column "${filter.column}" is not denormalized on analytics.page_stats. ` +
          `Route through canUseMv() and use the slow path instead.`,
      );
    }
    // Safe: column name is from the validated PAGE_STATS_COMPATIBLE_COLUMNS whitelist.
    const column = SQL.Unsafe(mvColumnFor(parsed.col));
    const values = SQL.StringArray({ [`page_stats_filter_${index}`]: filter.values });
    return safeSql`${filter.operator.quantifier}(pattern -> ${column} ${filter.operator.operater} pattern, ${values})`;
  });
}

/**
 * Build the filter WHERE-clause fragments for the merged-sessions CTE against
 * `analytics.sessions`. Only `country_code` / `device_type` / `browser` / `os`
 * apply at the session-table level — `url` does not exist on the sessions
 * table and is skipped (URL constraints are applied via the `path` join in
 * the calling query).
 *
 * Throws on a column that is not in `PAGE_STATS_COMPATIBLE_COLUMNS` — the
 * caller's `canUseMv` should have prevented that.
 */
function getSessionsTableFilters(queryFilters: QueryFilter[]) {
  const filtered = nonEmptyFilters(queryFilters);
  const transformed = TransformQueryFilterSchema.array().parse(filtered);

  const sessionScoped: TransformedFilter[] = [];
  for (const filter of transformed) {
    const parsed = parseFilterColumn(filter.column);
    if (parsed.kind !== 'standard' || !PAGE_STATS_COMPATIBLE_COLUMNS.has(parsed.col)) {
      throw new Error(
        `BAPageQuery.getMergedSessionsCte: filter column "${filter.column}" is not MV-compatible. ` +
          `Route through canUseMv() and use the slow path instead.`,
      );
    }
    if (SESSIONS_TABLE_COMPATIBLE_COLUMNS.has(parsed.col)) {
      sessionScoped.push(filter);
    }
    // url filters intentionally drop here — applied via the path join upstream.
  }

  if (sessionScoped.length === 0) return [safeSql`1=1`];

  return sessionScoped.map((filter, index) => {
    const parsed = parseFilterColumn(filter.column);
    // Safe: column name is from the validated SESSIONS_TABLE_COMPATIBLE_COLUMNS whitelist.
    const column = SQL.Unsafe((parsed as { kind: 'standard'; col: TableFilterColumn }).col);
    const values = SQL.StringArray({ [`sessions_filter_${index}`]: filter.values });
    return safeSql`${filter.operator.quantifier}(pattern -> ${column} ${filter.operator.operater} pattern, ${values})`;
  });
}

/**
 * Build a merged-sessions subquery without `FINAL`.
 *
 * Returns one row per `session_id` by `GROUP BY session_id` over the
 * `SimpleAggregateFunction` columns on `analytics.sessions`. Migration 28
 * defines those source columns as plain `SimpleAggregateFunction(min/max/sum, ...)`
 * so the read-time aggregators are plain `min` / `max` / `sum` — no `Merge`
 * variants required (see §6.7.5 of the design doc).
 *
 * For `entry_page` / `exit_page` (Tuple(DateTime, String)), `min` / `max`
 * compares lexicographically with `DateTime` first, so the semantic is
 * "row with the earliest / latest timestamp wins" — exactly what entry /
 * exit identification requires.
 */
function getMergedSessionsCte(opts: {
  siteId: string;
  startDate: DateTimeString;
  endDate: DateTimeString;
  queryFilters: QueryFilter[];
  includeEntryPage?: boolean;
  includeExitPage?: boolean;
}) {
  const { siteId, startDate, endDate, queryFilters, includeEntryPage, includeExitPage } = opts;

  const cols = [safeSql`session_id`, safeSql`sum(pageview_count) AS pageview_count`];
  if (includeEntryPage) cols.push(safeSql`min(entry_page) AS entry_page`);
  if (includeExitPage) cols.push(safeSql`max(exit_page) AS exit_page`);

  const filters = getSessionsTableFilters(queryFilters);

  return safeSql`
    SELECT ${SQL.SEPARATOR(cols)}
    FROM analytics.sessions
    WHERE site_id = ${SQL.String({ siteId })}
      AND session_created_at BETWEEN ${SQL.DateTime({ startDate })} AND ${SQL.DateTime({ endDate })}
      AND ${SQL.AND(filters)}
    GROUP BY session_id
  `;
}

export const BAPageQuery = {
  canUseMv,
  getPageStatsFilters,
  getMergedSessionsCte,
  PAGE_STATS_COMPATIBLE_COLUMNS,
};
