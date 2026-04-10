import { BAAnalyticsQuerySchema, type BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

const URL_SEARCH_PARAMS = Object.keys(BAAnalyticsQuerySchema.shape);

export function useUrlFilters(): BAAnalyticsQuery {
  const searchParams = useSearchParams();
  const paramsString = searchParams?.toString() ?? '';

  return useMemo(() => {
    const encodedFilterEntries = URL_SEARCH_PARAMS.map(
      (param) => [param, searchParams?.get(param) ?? undefined] as const,
    ).filter(([_key, value]) => Boolean(value));

    const encoded = Object.fromEntries(encodedFilterEntries);

    return BAFilterSearchParams.decode(encoded, Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [paramsString]);
}
