import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { stableStringify } from './stableStringify';

/**
 * Equality checking between query filters
 */
export function isQueryFiltersEqual(a: QueryFilter, b: QueryFilter) {
  return stableStringify(a) === stableStringify(b);
}

/**
 * Filters out empty query filters
 */
export function filterEmptyQueryFilters(filters: QueryFilter[]) {
  return filters.filter((filter) => filter.values.filter((value) => value !== ''));
}
