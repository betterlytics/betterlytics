import { z } from 'zod';
import { safeSql, SQL } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { getMetricByKey, METRIC_KEYS } from '@/lib/analytics-query/registry/metrics';
import {
  DIMENSION_KEYS,
  getDimensionByKey,
  validateDimensionColumn,
} from '@/lib/analytics-query/registry/dimensions';
import { resolveTimeRange } from '@/lib/analytics-query/resolveTimeRange';
import type { EventQueryInput } from '@/lib/analytics-query/query.entities';
import { GranularityRangeValues } from '@/utils/granularityRanges';

type BuildResult = {
  taggedSql: string;
  taggedParams: Record<string, unknown>;
};

// Aggregate sort keys are registry keys, parsed before they are written into the SQL.
const SortKeySchema = z.enum([...METRIC_KEYS, ...DIMENSION_KEYS]);

export function buildQuery(input: EventQueryInput, siteId: string): BuildResult {
  const timezone = input.timezone;
  const { startDateTime, endDateTime, granularity } = resolveTimeRange(input);

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
      limit: input.limit,
    });
  }

  const orderByKey = input.orderBy ?? input.metrics[0];
  const orderByColumn = SQL.Unsafe(SortKeySchema.parse(orderByKey));
  const orderDirection = input.order === 'asc' ? safeSql`ASC` : safeSql`DESC`;

  return buildAggregateQuery({
    siteId,
    startDateTime,
    endDateTime,
    metricExpressions,
    dimensionColumns,
    filters,
    orderByColumn,
    orderDirection,
    limit: input.limit,
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
      AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
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
      start_date: opts.startDateTime,
      end_date: opts.endDateTime,
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
