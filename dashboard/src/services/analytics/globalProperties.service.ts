'server-only';

import { getGlobalPropertiesKeyValueCounts, type GlobalPropertyKeyValueRow } from '@/repositories/clickhouse/globalProperties.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const DEFAULT_KEY_LIMIT = 10;
const DEFAULT_VALUE_LIMIT = 5;

export type GlobalPropertyAggregate = {
  property_key: string;
  count: number;
  values: { value: string; count: number }[];
};

export async function getGlobalPropertiesOverview(
  siteQuery: BASiteQuery,
  keyLimit: number = DEFAULT_KEY_LIMIT,
  valueLimit: number = DEFAULT_VALUE_LIMIT,
): Promise<GlobalPropertyAggregate[]> {
  const rows = await getGlobalPropertiesKeyValueCounts(siteQuery);
  return groupAndSort(rows, keyLimit, valueLimit);
}

function groupAndSort(
  rows: GlobalPropertyKeyValueRow[],
  keyLimit: number,
  valueLimit: number,
): GlobalPropertyAggregate[] {
  const grouped = new Map<string, { count: number; values: { value: string; count: number }[] }>();

  for (const row of rows) {
    const entry = grouped.get(row.property_key) ?? { count: 0, values: [] };
    entry.count += row.count;
    entry.values.push({ value: row.value, count: row.count });
    grouped.set(row.property_key, entry);
  }

  return Array.from(grouped.entries())
    .map(([property_key, { count, values }]) => ({
      property_key,
      count,
      values: values.slice(0, valueLimit),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, keyLimit);
}
