'server only';

import { QueryFilter, QueryFilterSchema } from '@/entities/filter';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { z } from 'zod';
import { safeSql, SQL } from './safe-sql';
import { DateTimeString } from '@/types/dates';
import { toClickHouseGridStartString } from '@/utils/dateFormatters';

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
const GranularityIntervalSchema = z.enum(['1 DAY', '1 HOUR', '1 MINUTE']);
const granularityIntervalMapper = {
  day: GranularityIntervalSchema.enum['1 DAY'],
  hour: GranularityIntervalSchema.enum['1 HOUR'],
  minute: GranularityIntervalSchema.enum['1 MINUTE'],
};

const DateColumnSchema = z.enum(['timestamp', 'date']);

/**
 * Returns SQL function to be used for granularity.
 * This will throw an exception if parameter is illegal
 */
function getGranularitySQLFunctionFromGranularityRange(granularity: GranularityRangeValues) {
  const interval = granularityIntervalMapper[granularity];
  const validatedInterval = GranularityIntervalSchema.parse(interval);
  return (column: z.infer<typeof DateColumnSchema>, date: DateTimeString) => {
    const validatedColumn = DateColumnSchema.parse(column);
    const alignedDate = toClickHouseGridStartString(date);
    return safeSql`toStartOfInterval(${SQL.Unsafe(validatedColumn)}, INTERVAL ${SQL.Unsafe(validatedInterval)}, ${SQL.DateTime({ granulairty_origin_date: alignedDate })} - INTERVAL 10 YEAR)`;
  };
}

export const BAQuery = {
  getGranularitySQLFunctionFromGranularityRange,
  getFilterQuery,
};
