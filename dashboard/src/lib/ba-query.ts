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

function getTimestampRange(timeRange: TimeRangeValue, granularity: GranularityRangeValues, timezone: string) {
  function getEndTimestamp() {
    const now = safeSql`now(${SQL.String({ timezone })})`;
    switch (timeRange) {
      case 'realtime':
      case '1h':
        return now;
      case '24h':
        return safeSql`toStartOfHour(addHours(${now}, 1))`;
      case 'today':
        return safeSql`toStartOfDay(addDays(${now}, 1))`;
      case 'yesterday':
        return safeSql`toStartOfDay(${now})`;
      case '7d':
      case '28d':
      case '90d':
        return safeSql`toStartOfDay(${now})`;
      case 'mtd':
        return safeSql`toStartOfDay(addDays(${now}, 1))`;
      case 'last_month':
        return safeSql`toStartOfMonth(${now})`;
      case 'ytd':
        return safeSql`toStartOfDay(addDays(${now}, 1))`;
      case '1y':
        return safeSql`toStartOfDay(${now})`;
      default:
        return now;
    }
  }

  function getStartTimestamp() {
    const end = getEndTimestamp();
    switch (timeRange) {
      case 'realtime':
        return safeSql`subtractMinutes(${end}, 30)`;
      case '1h':
        return safeSql`subtractHours(${end}, 1)`;
      case '24h':
        return safeSql`subtractDays(${end}, 1)`;
      case 'today':
        return safeSql`toStartOfDay(subtractDays(${end}, 1))`;
      case 'yesterday':
        return safeSql`subtractDays(${end}, 1)`;
      case '7d':
        return safeSql`subtractDays(${end}, 7)`;
      case '28d':
        return safeSql`subtractDays(${end}, 28)`;
      case '90d':
        return safeSql`subtractDays(${end}, 90)`;
      case 'mtd':
        return safeSql`toStartOfMonth(${end})`;
      case 'last_month':
        return safeSql`subtractMonths(${end}, 1)`;
      case 'ytd':
        return safeSql`toStartOfYear(${end})`;
      case '1y':
        return safeSql`subtractYears(${end}, 1)`;
      default:
        return end;
    }
  }

  const start = getStartTimestamp();
  const end = getEndTimestamp();

  // Note: the end timestamp is exclusive
  // the BETWEEN keyword seems to be inclusive of the end timestamp
  const range = safeSql`timestamp >= ${start} AND timestamp < ${end}`;

  // Create the fill
  const intervalFrom = safeSql`toStartOfInterval(${start}, ${getGranularityInterval(granularity)}, ${SQL.String({ timezone })})`;
  const intervalTo = safeSql`toStartOfInterval(${end}, ${getGranularityInterval(granularity)}, ${SQL.String({ timezone })})`;

  const fill = safeSql`FILL FROM ${intervalFrom} TO ${intervalTo} STEP ${getGranularityInterval(granularity)}`;

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
