import 'server-only';

import {
  parseFilterColumn,
  QueryFilter,
  QueryFilterSchema,
  type TableFilterColumn,
} from '@/entities/analytics/filter.entities';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { z } from 'zod';
import { safeSql, SQL, type SQLTaggedExpression } from './safe-sql';
import { DateTimeString } from '@/types/dates';
import { filterColumnSql, filterColumnSqlForSession } from './filter-sql';

// Filters
const MAIN_TABLE_FILTERS: TableFilterColumn[] = [
  'url',
  'event_type',
  'custom_event_name',
  'outbound_link_url',
];
const SESSION_TUPLE_COLUMNS: (TableFilterColumn | (typeof SESSIONS_TABLE_SELECTABLE_COLUMNS)[number])[] = [
  'entry_page',
  'exit_page',
  'referrer_source',
  'referrer_source_name',
  'referrer_search_term',
  'referrer_url',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
];

// Utility for filter query
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

// Selectors
const SESSIONS_TABLE_SELECTABLE_COLUMNS = [
  'site_id',
  'session_created_at',
  'session_id',
  'session_start',
  'session_end',
  'pageview_count',
  'entry_page',
  'exit_page',
  'visitor_id',
  'domain',
  'device_type',
  'browser',
  'browser_version',
  'os',
  'os_version',
  'country_code',
  'subdivision_code',
  'city',
  'referrer_source',
  'referrer_source_name',
  'referrer_search_term',
  'referrer_url',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

// Utilities for selectors
const SESSIONS_TABLE_SELECT_VALIDATOR = z.enum(SESSIONS_TABLE_SELECTABLE_COLUMNS);
type SessionsTableSelectableColumn = z.infer<typeof SESSIONS_TABLE_SELECT_VALIDATOR>;

function getSessionSelector(columns: SessionsTableSelectableColumn[]) {
  if (columns.length === 0) {
    return [safeSql`1`];
  }
  const parsedSelectors = SESSIONS_TABLE_SELECT_VALIDATOR.array().parse(columns);
  return parsedSelectors.map((sel) => buildSessionSelectColumn(sel));
}

function buildSessionSelectColumn(column: SessionsTableSelectableColumn) {
  const columnSql = SQL.Unsafe(column);
  if (SESSION_TUPLE_COLUMNS.includes(column)) {
    return safeSql`${columnSql}.2 as ${columnSql}`;
  }
  return columnSql;
}

/**
 * Build subquery for session table
 */
function getSessionTableSubQuery(
  columns: SessionsTableSelectableColumn[],
  queryFilters: QueryFilter[],
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  finalize: boolean = true,
) {
  const selectors = getSessionSelector(columns);
  const filters = getSessionFilterQuery(queryFilters, siteId, startDate, endDate);

  const final = finalize ? safeSql`FINAL` : safeSql``;
  return safeSql`
    ( SELECT ${SQL.SEPARATOR(selectors)}
      FROM analytics.sessions ${final}
      WHERE site_id = ${SQL.String({ siteId })} AND session_created_at BETWEEN ${SQL.DateTime({ startDate })} AND ${SQL.DateTime({ endDate })} AND ${SQL.AND(filters)} )
  `;
}

type TransformedFilter = z.infer<typeof TransformQueryFilterSchema>;
type StandardFilter = TransformedFilter & { col: TableFilterColumn };
type GpFilter = TransformedFilter & { gpKey: string };

/**
 * Build query filters using `safeSql`
 */
function getSessionFilterQuery(
  queryFilters: QueryFilter[],
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
) {
  const nonEmptyFilters = queryFilters.filter(
    (filter) =>
      Boolean(filter.column) && Boolean(filter.operator) && filter.values.every((value) => Boolean(value)),
  );

  const transformed = TransformQueryFilterSchema.array().parse(nonEmptyFilters);

  if (transformed.length === 0) {
    return [safeSql`1=1`];
  }

  const stdFilters: StandardFilter[] = [];
  const gpFilters: GpFilter[] = [];
  for (const filter of transformed) {
    const parsed = parseFilterColumn(filter.column);
    switch (parsed.kind) {
      case 'standard':
        stdFilters.push({ ...filter, col: parsed.col });
        break;
      case 'gp':
        gpFilters.push({ ...filter, gpKey: parsed.key });
        break;
    }
  }

  const eventsFilters = stdFilters.filter((filter) => MAIN_TABLE_FILTERS.includes(filter.col));

  const gpWhere = gpFilters.map((filter) => buildGlobalPropertyFilterQuery(filter));

  const sessionWhere = stdFilters
    .filter((filter) => !MAIN_TABLE_FILTERS.includes(filter.col))
    .map((filter) => buildSessionFilterQuery(filter));

  const baseWhere = [...gpWhere, ...sessionWhere];
  const WHERE = baseWhere.length > 0 ? baseWhere : [safeSql`1=1`];

  if (eventsFilters.length > 0) {
    return [...WHERE, ...buildEventsBridgeQueries(eventsFilters, siteId, startDate, endDate)];
  }

  return WHERE;
}

/**
 * Bridge event-scoped columns through analytics.events, since they don't exist
 * on session rows. `=` means "the session has a matching event"; `!=` must
 * exclude the whole session, so it becomes NOT IN over the positive match — a
 * per-event NOT ILIKE inside IN would pass any session with at least one other event.
 */
function buildEventsBridgeQueries(
  eventsFilters: StandardFilter[],
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
) {
  const bridge = (predicate: SQLTaggedExpression) =>
    safeSql`( SELECT session_id FROM analytics.events WHERE site_id = ${SQL.String({ siteId })} AND timestamp BETWEEN ${SQL.DateTime({ startDate })} AND ${SQL.DateTime({ endDate })} AND ${predicate} )`;

  const includes = eventsFilters
    .filter((filter) => filter.rawOperator === '=')
    .map((filter) => buildFilterQuery(filter));
  const excludes = eventsFilters
    .filter((filter) => filter.rawOperator === '!=')
    .map((filter) => buildEventMatchQuery(filter));

  return [
    ...(includes.length > 0 ? [safeSql`session_id IN ${bridge(SQL.AND(includes))}`] : []),
    ...(excludes.length > 0 ? [safeSql`session_id NOT IN ${bridge(safeSql`(${SQL.OR(excludes)})`)}`] : []),
  ];
}

const EVENT_MATCH_TYPE_GUARDS: Partial<Record<TableFilterColumn, SQLTaggedExpression>> = {
  custom_event_name: safeSql`event_type = 'custom'`,
  outbound_link_url: safeSql`event_type = 'outbound_link'`,
};

/**
 * Positive per-event match used by the NOT IN bridge. The event_type guard pins
 * columns to the only event type that carries them, which both prunes on the
 * (site_id, event_type, date) primary key and keeps all-wildcard patterns
 * (`*` → `%`) from matching events where the column is unset — so
 * `custom_event_name != *` reads "sessions with no custom events".
 */
function buildEventMatchQuery(filter: StandardFilter) {
  const filterHash = hashFilterQuery(filter);
  const values = SQL.StringArray({ [`query_filter_${filterHash}`]: filter.values });
  const column = filterColumnSql(filter.col);
  const match = safeSql`arrayExists(pattern -> ${column} ILIKE pattern, ${values})`;
  const guard = EVENT_MATCH_TYPE_GUARDS[filter.col];
  return guard ? safeSql`(${guard} AND ${match})` : safeSql`(${match})`;
}

function hashFilterQuery(filter: z.infer<typeof TransformQueryFilterSchema>) {
  const str = JSON.stringify(filter);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16);
}

function buildFilterQuery(filter: StandardFilter) {
  const filterHash = hashFilterQuery(filter);
  const values = SQL.StringArray({ [`query_filter_${filterHash}`]: filter.values });
  const column = filterColumnSql(filter.col);
  return safeSql`${filter.operator.quantifier}(pattern -> ${column} ${filter.operator.operater} pattern, ${values})`;
}

// Global-property filter against the unioned all_props on analytics.sessions.
// A session matches when at least one of its events carried a matching (key, value) pair.
// `*` wildcard (passed in as `%` after transform) against any value is treated as
// "key exists in this session".
function buildGlobalPropertyFilterQuery(filter: GpFilter) {
  const filterHash = hashFilterQuery(filter);
  const key = SQL.String({ [`gp_key_${filterHash}`]: filter.gpKey });
  const isEquals = filter.rawOperator === '=';

  const isMatchAnyValue = filter.values.length === 1 && filter.values[0] === '%';
  if (isMatchAnyValue) {
    return isEquals
      ? safeSql`arrayExists(t -> t.1 = ${key}, all_props)`
      : safeSql`NOT arrayExists(t -> t.1 = ${key}, all_props)`;
  }

  const values = SQL.StringArray({ [`gp_vals_${filterHash}`]: filter.values });
  const anyValueMatches = safeSql`arrayExists(t -> t.1 = ${key} AND arrayExists(v -> t.2 ILIKE v, ${values}), all_props)`;
  return isEquals ? anyValueMatches : safeSql`NOT ${anyValueMatches}`;
}

function buildSessionFilterQuery(filter: StandardFilter) {
  const column = filterColumnSqlForSession(filter.col, SESSION_TUPLE_COLUMNS);
  const filterHash = hashFilterQuery(filter);
  const values = SQL.StringArray({ [`query_filter_${filterHash}`]: filter.values });
  const quantifier = filter.operator.quantifier;
  const operator = filter.operator.operater;

  return safeSql`${quantifier}(pattern -> ${column} ${operator} pattern, ${values})`;
}

// Utility for granularity
const GranularityIntervalSchema = z.enum([
  '1 MONTH',
  '1 WEEK',
  '1 DAY',
  '1 HOUR',
  '30 MINUTE',
  '15 MINUTE',
  '1 MINUTE',
]);
const granularityIntervalMapper = {
  month: GranularityIntervalSchema.enum['1 MONTH'],
  week: GranularityIntervalSchema.enum['1 WEEK'],
  day: GranularityIntervalSchema.enum['1 DAY'],
  hour: GranularityIntervalSchema.enum['1 HOUR'],
  minute_30: GranularityIntervalSchema.enum['30 MINUTE'],
  minute_15: GranularityIntervalSchema.enum['15 MINUTE'],
  minute_1: GranularityIntervalSchema.enum['1 MINUTE'],
} as const;

const DateColumnSchema = z.enum(['date', 'session_start', 'session_end', 'session_created_at']);

function getGranularityInterval(granularity: GranularityRangeValues) {
  const clickhouseInterval = granularityIntervalMapper[granularity];
  const validatedInterval = GranularityIntervalSchema.parse(clickhouseInterval);
  return safeSql`INTERVAL ${SQL.Unsafe(validatedInterval)}`;
}

/**
 * Returns SQL function to be used for granularity.
 * This will throw an exception if parameter is illegal
 */
function getGranularitySQLFunctionFromGranularityRange(granularity: GranularityRangeValues, timezone: string) {
  const clickhouseInterval = getGranularityInterval(granularity);
  return (column: z.infer<typeof DateColumnSchema>) => {
    const validatedColumn = DateColumnSchema.parse(column);
    const interval = safeSql`toStartOfInterval(${SQL.Unsafe(validatedColumn)}, ${clickhouseInterval}, ${SQL.String({ timezone })})`;
    return safeSql`${interval}`;
  };
}

function getSessionStartRange(
  granularity: GranularityRangeValues,
  timezone: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
) {
  const start = SQL.DateTime({ startDate });
  const end = SQL.DateTime({ endDate });

  const interval = getGranularityInterval(granularity);

  const range = safeSql`session_created_at BETWEEN ${start} AND ${end}`;

  // Create the fill
  const intervalFrom = safeSql`toStartOfInterval(${start}, ${interval}, ${SQL.String({ timezone })})`;

  const isCoarseGranularity = granularity === 'week' || granularity === 'month';
  const intervalTo = isCoarseGranularity
    ? safeSql`toStartOfInterval(${end}, ${interval}, ${SQL.String({ timezone })}) + ${interval}`
    : safeSql`toStartOfInterval(addSeconds(${end}, 1), ${interval}, ${SQL.String({ timezone })})`;

  const fill = safeSql`WITH FILL FROM ${intervalFrom} TO ${intervalTo} STEP ${interval}`;

  // Wrapper for converting final date from user timezone to UTC
  // Note: toStartOfInterval with week/month returns Date type, not DateTime, hence the cast
  const timeWrapper = (sql: ReturnType<typeof safeSql>) => {
    return safeSql`SELECT toTimezone(toDateTime64(date, 0), 'UTC') as date, q.* EXCEPT (date) FROM (${sql}) q`;
  };

  // Granularity function
  const granularityFunc = getGranularitySQLFunctionFromGranularityRange(granularity, timezone);

  return {
    range,
    fill,
    timeWrapper,
    granularityFunc,
  };
}

export const BASessionQuery = {
  getSessionStartRange,
  getSessionTableSubQuery,
};
