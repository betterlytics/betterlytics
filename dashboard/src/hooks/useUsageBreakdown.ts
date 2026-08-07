'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserUsageBreakdown } from '@/actions/billing.action';

const USAGE_BREAKDOWN_QUERY_KEY = ['userUsageBreakdown'] as const;

export function useUsageBreakdown() {
  const query = useQuery({
    queryKey: USAGE_BREAKDOWN_QUERY_KEY,
    queryFn: async () => {
      const result = await getUserUsageBreakdown();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });

  return {
    breakdown: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? query.error.message : null,
  };
}
