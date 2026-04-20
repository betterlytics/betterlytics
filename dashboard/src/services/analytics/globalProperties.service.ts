'server-only';

import {
  getTopGlobalPropertyKeys,
  getTopGlobalPropertyValuesForKeys,
} from '@/repositories/clickhouse/globalProperties.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const DEFAULT_KEY_LIMIT = 10;
const DEFAULT_VALUE_LIMIT = 20;

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
  const topKeys = await getTopGlobalPropertyKeys(siteQuery, keyLimit);
  if (topKeys.length === 0) {
    return [];
  }

  const valueRows = await getTopGlobalPropertyValuesForKeys(
    siteQuery,
    topKeys.map((k) => k.property_key),
    valueLimit,
  );

  const valuesByKey = new Map<string, { value: string; count: number }[]>();
  for (const row of valueRows) {
    const list = valuesByKey.get(row.property_key) ?? [];
    list.push({ value: row.value, count: row.count });
    valuesByKey.set(row.property_key, list);
  }

  return topKeys.map(({ property_key, count }) => ({
    property_key,
    count,
    values: valuesByKey.get(property_key) ?? [],
  }));
}
