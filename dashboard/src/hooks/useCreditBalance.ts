'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserCreditBalance } from '@/actions/billing.action';

const CREDIT_BALANCE_QUERY_KEY = ['creditBalance'] as const;

export function useCreditBalance(enabled: boolean = true) {
  const query = useQuery({
    queryKey: CREDIT_BALANCE_QUERY_KEY,
    queryFn: async () => {
      const result = await getUserCreditBalance();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled,
  });

  return {
    creditBalance: query.data?.creditBalance ?? 0,
    currency: query.data?.currency ?? 'USD',
    isLoading: query.isLoading,
    error: query.error ? query.error.message : null,
  };
}
