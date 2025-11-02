'server only';

import { QueryFilter, QueryFilterSchema } from '@/entities/filter';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { z } from 'zod';
import { safeSql, SQL } from './safe-sql';
import { DateTimeString } from '@/types/dates';
import { toClickHouseGridStartString } from '@/utils/dateFormatters';
import { TimeRangeValue } from '@/utils/timeRanges';

// Utility for filter query
const INTERNAL_FILTER_OPERATORS = {
  '=': 'ILIKE',
  '!=': 'NOT ILIKE',
} as const;

const TransformQueryFilterSchema = QueryFilterSchema.transform((filter) => ({
  ...filter,
  operator: INTERNAL_FILTER_OPERATORS[filter.operator],
  value: filter.value.replaceAll('*', '%'),
}));

/**
 * Build query filters using `safeSql`
 */
function getFilterQuery(queryFilters: QueryFilter[]) {
  const nonEmptyFilters = queryFilters.filter(
    (filter) => Boolean(filter.column) && Boolean(filter.operator) && Boolean(filter.value),
  );

  const filters = TransformQueryFilterSchema.array().parse(nonEmptyFilters);

  if (filters.length === 0) {
    return [safeSql`1=1`];
  }

  return filters.map(({ column, operator, value }, index) => {
    return safeSql`${SQL.Unsafe(column)} ${SQL.Unsafe(operator)} ${SQL.String({ [`query_filter_${index}`]: value })}`;
  });
}

// Utility for granularity
const GranularityIntervalSchema = z.enum(['1 DAY', '1 HOUR', '30 MINUTE', '15 MINUTE', '1 MINUTE']);
const granularityIntervalMapper = {
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
  const range = safeSql`timestamp >= ${start} AND timestamp < ${end}`;

  // Create the fill
  const intervalFrom = safeSql`toStartOfInterval(${start}, ${interval}, ${SQL.String({ timezone })})`;
  const intervalTo = safeSql`toStartOfInterval(${end}, ${interval}, ${SQL.String({ timezone })})`;

  const fill = safeSql`FILL FROM ${intervalFrom} TO ${intervalTo} STEP ${interval}`;

  // Wrapper for converting final date from user timezone to UTC
  const timeWrapper = (sql: ReturnType<typeof safeSql>) => {
    return safeSql`SELECT toTimezone(date, 'UTC') as date, q.* EXCEPT (date) FROM (${sql}) q`;
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

export const BAQuery = {
  getGranularitySQLFunctionFromGranularityRange,
  getFilterQuery,
  getTimestampRange,
  getGranularityInterval,
};
