import { type QueryFilter } from '@/entities/filter';

/**
 * Equality checking between query filters
 */
export function isQueryFiltersEqual(a: QueryFilter, b: QueryFilter) {
  return a.id === b.id && a.column === b.column && a.operator === b.operator && a.value === b.value;
}

/**
 * Filters out empty query filters
 */
export function filterEmptyQueryFilters(filters: QueryFilter[]) {
  return filters.filter((filter) => filter.value !== '');
}
