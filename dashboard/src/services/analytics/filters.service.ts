'server-only';

import { type FilterColumn, parseFilterColumn, PROPERTY_KEY_PATTERN } from '@/entities/analytics/filter.entities';
import { type PropertySourceKind } from '@/entities/analytics/propertySources';
import {
  getFilterDistinctValues,
  getPropertyKeys,
  getPropertyValues,
} from '@/repositories/clickhouse/filters.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { toDateTimeString } from '@/utils/dateFormatters';

export async function getDistinctValuesForFilterColumn(
  siteQuery: BASiteQuery,
  column: FilterColumn,
  search?: string,
  limit?: number,
  rankFrom?: Date,
) {
  const parsed = parseFilterColumn(column);
  const rankFromDateTime = rankFrom ? toDateTimeString(rankFrom) : undefined;
  if (parsed.kind === 'standard') {
    return getFilterDistinctValues(siteQuery, parsed.col, limit, search?.trim(), rankFromDateTime);
  }
  return getPropertyValues(siteQuery, parsed.source, parsed.key, search?.trim(), limit, rankFromDateTime);
}

/* Keys that fail the filter-column constraint would be unusable as filters, so discovery hides them. */
export async function getAvailablePropertyKeys(
  siteQuery: BASiteQuery,
  source: PropertySourceKind,
  search?: string,
  limit?: number,
) {
  const keys = await getPropertyKeys(siteQuery, source, search?.trim(), limit);
  return keys.filter((key) => PROPERTY_KEY_PATTERN.test(key));
}
