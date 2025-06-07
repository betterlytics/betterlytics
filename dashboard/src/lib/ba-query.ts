'server only';

import { QueryFilter, QueryFilterSchema } from '@/entities/filter';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { z } from 'zod';
import { safeSql, SQL } from './safe-sql';

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
const GranularitySchema = z.enum(['toStartOfDay', 'toStartOfHour', 'toStartOfMinute']);
const granularityMapper = {
  day: GranularitySchema.enum.toStartOfDay,
  hour: GranularitySchema.enum.toStartOfHour,
  minute: GranularitySchema.enum.toStartOfMinute,
} as const;

/**
 * Returns SQL function to be used for granularity.
 * This will throw an exception if parameter is illegal
 */
function getGranularitySQLFunctionFromGranularityRange(granularity: GranularityRangeValues) {
  const mappedGranularity = granularityMapper[granularity];
  const validatedGranularity = GranularitySchema.parse(mappedGranularity);
  return SQL.Unsafe(validatedGranularity);
}

export const BAQuery = {
  getGranularitySQLFunctionFromGranularityRange,
  getFilterQuery,
};
