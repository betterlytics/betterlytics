import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { getMetricByKey } from '@/mcp/registry/metrics';
import { getDimensionByKey, validateDimensionColumn } from '@/mcp/registry/dimensions';
import { getResolvedRanges } from '@/lib/ba-timerange';
import { toDateTimeString } from '@/utils/dateFormatters';
import { McpQueryInput } from '@/mcp/entities/mcp.entities';
import { GranularityRangeValues } from '@/utils/granularityRanges';

type BuildResult = {
  taggedSql: string;
  taggedParams: Record<string, unknown>;
};

export function buildQuery(input: McpQueryInput, siteId: string, timezone: string): BuildResult {
  const customStart = input.startDate ? new Date(input.startDate) : new Date();
  const customEnd = input.endDate ? new Date(input.endDate) : new Date();

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
  const granularity = ranges.granularity;

  const metricExpressions = input.metrics.map((key) => {
    const metric = getMetricByKey(key);
    if (!metric) throw new Error(`Unknown metric: ${key}`);
    return safeSql`${metric.expression}`;
  });

  const dimensionColumns = (input.dimensions ?? []).map((key) => {
    const dim = getDimensionByKey(key);
    if (!dim) throw new Error(`Unknown dimension: ${key}`);
    const column = validateDimensionColumn(dim.column);
    return SQL.Unsafe(column);
  });

  const filters = BAQuery.getFilterQuery((input.filters ?? []).map((f, i) => ({ ...f, id: `mcp_filter_${i}` })));

  const orderByKey = input.orderBy ?? input.metrics[0];
  const orderByColumn = SQL.Unsafe(orderByKey);
  const orderDirection = input.order === 'asc' ? safeSql`ASC` : safeSql`DESC`;

  if (input.granularity) {
    return buildTimeSeriesQuery({
      siteId,
      startDateTime,
      endDateTime,
      granularity,
      timezone,
      metricExpressions,
      dimensionColumns,
      filters,
      orderByColumn,
      orderDirection,
      limit: input.limit ?? 100,
    });
  }

  return buildAggregateQuery({
    siteId,
    startDateTime,
    endDateTime,
    metricExpressions,
    dimensionColumns,
    filters,
    orderByColumn,
    orderDirection,
    limit: input.limit ?? 100,
  });
}

function buildAggregateQuery(opts: {
  siteId: string;
  startDateTime: string;
  endDateTime: string;
  metricExpressions: ReturnType<typeof safeSql>[];
  dimensionColumns: ReturnType<typeof safeSql>[];
  filters: ReturnType<typeof safeSql>[];
  orderByColumn: ReturnType<typeof safeSql>;
  orderDirection: ReturnType<typeof safeSql>;
  limit: number;
}): BuildResult {
  const selectParts = [...opts.dimensionColumns, ...opts.metricExpressions];

  const hasGroupBy = opts.dimensionColumns.length > 0;
  const groupByParts = opts.dimensionColumns;

  const query = safeSql`
    SELECT ${SQL.SEPARATOR(selectParts)}
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND ${SQL.AND(opts.filters)}
    ${hasGroupBy ? safeSql`GROUP BY ${SQL.SEPARATOR(groupByParts)}` : safeSql``}
    ORDER BY ${opts.orderByColumn} ${opts.orderDirection}
    LIMIT {limit:UInt32}
  `;

  return {
    taggedSql: query.taggedSql,
    taggedParams: {
      ...query.taggedParams,
      site_id: opts.siteId,
      start: opts.startDateTime,
      end: opts.endDateTime,
      limit: opts.limit,
    },
  };
}

function buildTimeSeriesQuery(opts: {
  siteId: string;
  startDateTime: string;
  endDateTime: string;
  granularity: GranularityRangeValues;
  timezone: string;
  metricExpressions: ReturnType<typeof safeSql>[];
  dimensionColumns: ReturnType<typeof safeSql>[];
  filters: ReturnType<typeof safeSql>[];
  orderByColumn: ReturnType<typeof safeSql>;
  orderDirection: ReturnType<typeof safeSql>;
  limit: number;
}): BuildResult {
  const { range, fill, timeWrapper, granularityFunc } = BAQuery.getTimestampRange(
    opts.granularity,
    opts.timezone,
    opts.startDateTime,
    opts.endDateTime,
  );

  const selectParts = [
    safeSql`${granularityFunc('timestamp')} as date`,
    ...opts.dimensionColumns,
    ...opts.metricExpressions,
  ];

  const groupByParts = [safeSql`date`, ...opts.dimensionColumns];

  const innerQuery = safeSql`
    SELECT ${SQL.SEPARATOR(selectParts)}
    FROM analytics.events
    WHERE site_id = {site_id:String}
      AND ${range}
      AND ${SQL.AND(opts.filters)}
    GROUP BY ${SQL.SEPARATOR(groupByParts)}
    ORDER BY date ASC ${fill}
    LIMIT {limit:UInt32}
  `;

  const query = timeWrapper(innerQuery);

  return {
    taggedSql: query.taggedSql,
    taggedParams: {
      ...query.taggedParams,
      site_id: opts.siteId,
      start_date: opts.startDateTime,
      end_date: opts.endDateTime,
      limit: opts.limit,
    },
  };
}
