'server-only';

import {
  getTopGlobalPropertyKeys,
  getTopGlobalPropertyValuesForKeys,
} from '@/repositories/clickhouse/globalProperties.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export type GlobalPropertyAggregate = {
  property_key: string;
  visitors: number;
  values: { value: string; visitors: number }[];
};

export async function getGlobalPropertiesOverview(
  siteQuery: BASiteQuery,
  keyLimit: number,
  valueLimit: number,
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

  const valuesByKey = new Map<string, { value: string; visitors: number }[]>();
  for (const row of valueRows) {
    const list = valuesByKey.get(row.property_key) ?? [];
    list.push({ value: row.value, visitors: row.visitors });
    valuesByKey.set(row.property_key, list);
  }

  return topKeys.map(({ property_key, visitors }) => ({
    property_key,
    visitors,
    values: valuesByKey.get(property_key) ?? [],
  }));
}
