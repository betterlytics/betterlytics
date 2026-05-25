'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserBillingData } from '@/actions/billing.action';

const BILLING_QUERY_KEY = ['userBilling'] as const;

export function useBillingData() {
  const query = useQuery({
    queryKey: BILLING_QUERY_KEY,
    queryFn: async () => {
      const result = await getUserBillingData();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });

  return {
    billingData: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? query.error.message : null,
    refetch: query.refetch,
  };
}
