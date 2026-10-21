import { safeSql, SQL, type SQLTaggedExpression } from '@/lib/safe-sql';
import { BASessionQuery, type SessionsTableSelectableColumn } from '@/lib/ba-session-query';
import { getResolvedRanges } from '@/lib/ba-timerange';
import { matchAnyValueFilterSql } from '@/lib/filter-sql';
import type { QueryFilter } from '@/entities/analytics/filter.entities';
import { toDateTimeString } from '@/utils/dateFormatters';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { getSessionMetricByKey, SESSION_METRIC_KEYS } from '@/mcp/registry/sessionMetrics';
import {
  getSessionDimensionByKey,
  SESSION_DIMENSION_COLUMNS,
  SESSION_DIMENSION_KEYS,
} from '@/mcp/registry/sessionDimensions';
import {
  isSessionPageFilterColumn,
  type McpQuerySessionsInput,
  type McpSessionPageFilter,
} from '@/mcp/entities/mcp.entities';
import { z } from 'zod';

type BuildResult = {
  taggedSql: string;
  taggedParams: Record<string, unknown>;
};

// Every name this builder writes into the SQL text: dimension columns (entry_page and exit_page
// included), dimension keys used as aliases, and metric keys used as sort keys.
const SqlIdentifierSchema = z.enum([
  ...SESSION_DIMENSION_COLUMNS,
  ...SESSION_DIMENSION_KEYS,
  ...SESSION_METRIC_KEYS,
]);

/** The builder's only raw SQL: the name is parsed against the fixed list above before it is injected. */
function identifierSql(name: string) {
  return SQL.Unsafe(SqlIdentifierSchema.parse(name));
}

/**
 * Aggregates analytics.sessions for the query_sessions tool. Sessions are picked by when they
 * started and filtered exactly like the dashboard's session queries; entry and exit page
 * filters apply on top, to the selected sessions.
 */
export function buildSessionsQuery(input: McpQuerySessionsInput, siteId: string): BuildResult {
  const timezone = input.timezone;
  const customStart = new Date(input.startDate!);
  const customEnd = new Date(input.endDate!);

  const ranges = getResolvedRanges(
    input.timeRange,
    'off',
    timezone,
    customStart,
    customEnd,
    input.granularity ?? 'day',
    undefined,
    undefined,
    0,
    false,
  );

  const startDateTime = toDateTimeString(ranges.main.start);
  const endDateTime = toDateTimeString(ranges.main.end);
  const isTimeSeries = Boolean(input.granularity);

  const metrics = [...new Set(input.metrics)].map((key) => {
    const metric = getSessionMetricByKey(key);
    if (!metric) throw new Error(`Unknown metric: ${key}`);
    return metric;
  });

  const dimensions = [...new Set(input.dimensions ?? [])].map((key) => {
    const dim = getSessionDimensionByKey(key);
    if (!dim) throw new Error(`Unknown dimension: ${key}`);
    const columnSql = identifierSql(dim.column);
    const selectSql = dim.column === dim.key ? columnSql : safeSql`${columnSql} AS ${identifierSql(dim.key)}`;
    return { column: dim.column, columnSql, selectSql };
  });

  const pageFilters: McpSessionPageFilter[] = [];
  const queryFilters: QueryFilter[] = [];
  (input.filters ?? []).forEach((filter, i) => {
    const { column } = filter;
    if (!isSessionPageFilterColumn(column)) {
      queryFilters.push({ ...filter, column, id: `mcp_filter_${i}` });
    } else if (filter.values.every(Boolean)) {
      // Incomplete filters are skipped, as the session subquery does for the other columns.
      pageFilters.push({ ...filter, column });
    }
  });

  const countsFirstSessions = isTimeSeries && metrics.some((m) => m.timeSeriesExpression);

  const columns = new Set<SessionsTableSelectableColumn>([
    ...(isTimeSeries ? (['session_created_at'] as const) : []),
    ...(countsFirstSessions ? (['visitor_id'] as const) : []),
    ...metrics.flatMap((m) => m.columns),
    ...dimensions.map((d) => d.column),
    ...pageFilters.map((f) => f.column),
  ]);

  const sessionSubQuery = BASessionQuery.getSessionTableSubQuery(
    [...columns],
    queryFilters,
    siteId,
    startDateTime,
    endDateTime,
  );

  const dimensionColumns = dimensions.map((d) => d.columnSql);

  // Breakdowns leave out sessions without a value for any requested dimension.
  const sessionWhere = [
    ...pageFilters.map((filter, i) => buildPageFilter(filter, i)),
    ...dimensionColumns.map((column) => safeSql`${column} != ''`),
  ];

  // A visitor counts once, in the bucket of their first selected session (per group).
  const firstSessionWindow = countsFirstSessions
    ? safeSql`, min(session_created_at) OVER (PARTITION BY ${SQL.SEPARATOR([safeSql`visitor_id`, ...dimensionColumns])}) AS first_session_created_at`
    : safeSql``;

  const sessions = safeSql`(
    SELECT *${firstSessionWindow}
    FROM ${sessionSubQuery}
    WHERE ${SQL.AND(sessionWhere.length > 0 ? sessionWhere : [safeSql`1=1`])}
  )`;

  const dimensionSelects = dimensions.map((d) => d.selectSql);

  if (isTimeSeries) {
    return buildTimeSeriesQuery({
      sessions,
      granularity: ranges.granularity,
      timezone,
      startDateTime,
      endDateTime,
      dimensionSelects,
      dimensionColumns,
      metricExpressions: metrics.map((m) => m.timeSeriesExpression ?? m.expression),
      limit: input.limit,
    });
  }

  const orderByKey = input.orderBy ?? metrics[0].key;
  const orderByColumn = identifierSql(orderByKey);
  const orderDirection = input.order === 'asc' ? safeSql`ASC` : safeSql`DESC`;

  const query = safeSql`
    SELECT ${SQL.SEPARATOR([...dimensionSelects, ...metrics.map((m) => m.expression)])}
    FROM ${sessions}
    ${dimensionColumns.length > 0 ? safeSql`GROUP BY ${SQL.SEPARATOR(dimensionColumns)}` : safeSql``}
    ORDER BY ${orderByColumn} ${orderDirection}
    LIMIT ${SQL.UInt32({ limit: input.limit })}
  `;

  return { taggedSql: query.taggedSql, taggedParams: query.taggedParams };
}

function buildTimeSeriesQuery(opts: {
  sessions: SQLTaggedExpression;
  granularity: GranularityRangeValues;
  timezone: string;
  startDateTime: string;
  endDateTime: string;
  dimensionSelects: SQLTaggedExpression[];
  dimensionColumns: SQLTaggedExpression[];
  metricExpressions: SQLTaggedExpression[];
  limit: number;
}): BuildResult {
  const { fill, timeWrapper, granularityFunc } = BASessionQuery.getSessionStartRange(
    opts.granularity,
    opts.timezone,
    opts.startDateTime,
    opts.endDateTime,
  );

  // Zero-filled rows would carry an empty dimension value, so only plain series are filled.
  const dateFill = opts.dimensionColumns.length === 0 ? fill : safeSql``;

  const selectParts = [
    safeSql`${granularityFunc('session_created_at')} AS date`,
    ...opts.dimensionSelects,
    ...opts.metricExpressions,
  ];

  const innerQuery = safeSql`
    SELECT ${SQL.SEPARATOR(selectParts)}
    FROM ${opts.sessions}
    GROUP BY ${SQL.SEPARATOR([safeSql`date`, ...opts.dimensionColumns])}
    ORDER BY date ASC ${dateFill}
    LIMIT ${SQL.UInt32({ limit: opts.limit })}
  `;

  const query = timeWrapper(innerQuery);

  return { taggedSql: query.taggedSql, taggedParams: query.taggedParams };
}

/** Entry and exit page filters, with the same pattern and `*` semantics as the other filters. */
function buildPageFilter(filter: McpSessionPageFilter, index: number) {
  const column = identifierSql(filter.column);
  const patterns = filter.values.map((value) => value.replaceAll('*', '%'));
  const values = SQL.StringArray({ [`mcp_page_filter_${index}`]: patterns });

  return (
    matchAnyValueFilterSql(patterns, filter.operator, column) ??
    (filter.operator === '='
      ? safeSql`arrayExists(pattern -> ${column} ILIKE pattern, ${values})`
      : safeSql`arrayAll(pattern -> ${column} NOT ILIKE pattern, ${values})`)
  );
}
