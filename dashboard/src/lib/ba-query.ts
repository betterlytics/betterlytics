'server only';

import { parseFilterColumn, QueryFilter, QueryFilterSchema } from '@/entities/analytics/filter.entities';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { z } from 'zod';
import { safeSql, SQL } from './safe-sql';
import { filterColumnSql } from './filter-sql';
import { DateTimeString } from '@/types/dates';
import { isHighTrafficSite } from '@/repositories/clickhouse/usage.repository';
import { setSiteConcurrencyLimit } from '@/observability/clickhouse-concurrency';
import { env } from '@/lib/env';

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

/**
 * Build query filters using `safeSql`
 */
function getFilterQuery(queryFilters: QueryFilter[]) {
  const nonEmptyFilters = queryFilters.filter(
    (filter) =>
      Boolean(filter.column) && Boolean(filter.operator) && filter.values.every((value) => Boolean(value)),
  );

  const filters = TransformQueryFilterSchema.array().parse(nonEmptyFilters);

  if (filters.length === 0) {
    return [safeSql`1=1`];
  }

  return filters.map((filter, index) => buildFilterQuery(filter, index));
}

function getCompoundStepCondition(filters: QueryFilter[], stepIndex: number) {
  const nonEmptyFilters = filters.filter(
    (filter) =>
      Boolean(filter.column) && Boolean(filter.operator) && filter.values.every((value) => Boolean(value)),
  );

  const parsed = TransformQueryFilterSchema.array().parse(nonEmptyFilters);

  if (parsed.length === 0) {
    return safeSql`1=1`;
  }

  const conditions = parsed.map((filter, filterIdx) =>
    buildFilterQuery(filter, stepIndex * 100 + filterIdx),
  );

  if (conditions.length === 1) {
    return conditions[0];
  }

  return safeSql`(${SQL.AND(conditions)})`;
}

function buildFilterQuery(filter: z.infer<typeof TransformQueryFilterSchema>, filterIndex: number) {
  const parsed = parseFilterColumn(filter.column);
  const values = SQL.StringArray({ [`query_filter_${filterIndex}`]: filter.values });

  switch (parsed.kind) {
    case 'gp': {
      const key = SQL.String({ [`gp_key_${filterIndex}`]: parsed.key });
      const isWildcard = filter.values.length === 1 && filter.values[0] === '%';
      if (isWildcard) {
        const hasKey = safeSql`has(global_properties_keys, ${key})`;
        return filter.rawOperator === '=' ? hasKey : safeSql`NOT ${hasKey}`;
      }
      const extract = safeSql`global_properties_values[indexOf(global_properties_keys, ${key})]`;
      return safeSql`${filter.operator.quantifier}(pattern -> ${extract} ${filter.operator.operater} pattern, ${values})`;
    }
    default: {
      const column = filterColumnSql(parsed.col);
      return safeSql`${filter.operator.quantifier}(pattern -> ${column} ${filter.operator.operater} pattern, ${values})`;
    }
  }
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

const DateColumnSchema = z.enum(['timestamp', 'date', 'custom_date']);

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

function getTimestampRange(
  granularity: GranularityRangeValues,
  timezone: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
) {
  const start = SQL.DateTime({ startDate });
  const end = SQL.DateTime({ endDate });

  const interval = getGranularityInterval(granularity);

  // Note: the end timestamp is exclusive
  // the BETWEEN keyword seems to be inclusive of the end timestamp
  const range = safeSql`timestamp BETWEEN ${start} AND ${end}`;

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

async function getSampling(siteId: string, startDate: DateTimeString, endDate: DateTimeString) {
  const highTraffic = await isHighTrafficSite(siteId, startDate, endDate);
  const sampleFactor = highTraffic ? env.SAMPLING_FACTOR : 1;

  if (highTraffic) {
    setSiteConcurrencyLimit(siteId, env.HIGH_TRAFFIC_CONCURRENCY_LIMIT);
  }

  const sample = safeSql`SAMPLE ${SQL.Unsafe(sampleFactor.toString())}`;

  return { sample };
}

export const BAQuery = {
  getFilterQuery,
  getCompoundStepCondition,
  getTimestampRange,
  getSampling,
};
