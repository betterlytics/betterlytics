import { BAAnalyticsQuerySchema, type BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { stableStringify } from '@/utils/stableStringify';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

const URL_SEARCH_PARAMS = Object.keys(BAAnalyticsQuerySchema.shape);

export function useUrlFilters(): BAAnalyticsQuery {
  const searchParams = useSearchParams();
  const encodedFilterEntries = URL_SEARCH_PARAMS.map(
    (param) => [param, searchParams?.get(param) ?? undefined] as const,
  ).filter(([_key, value]) => Boolean(value));

  const encoded = Object.fromEntries(encodedFilterEntries);

  const decoded = BAFilterSearchParams.decode(encoded, Intl.DateTimeFormat().resolvedOptions().timeZone);

  return useMemo(() => decoded, [stableStringify(decoded)]);
}
