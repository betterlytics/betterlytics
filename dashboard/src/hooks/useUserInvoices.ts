'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserInvoices } from '@/actions/billing.action';

const USER_INVOICES_QUERY_KEY = ['userInvoices'] as const;

export function useUserInvoices(enabled: boolean = true) {
  const query = useQuery({
    queryKey: USER_INVOICES_QUERY_KEY,
    queryFn: async () => {
      const result = await getUserInvoices();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled,
  });

  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? query.error.message : null,
  };
}
