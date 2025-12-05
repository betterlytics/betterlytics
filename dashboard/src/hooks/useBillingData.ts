'use client';

import { useEffect, useState } from 'react';
import { getUserBillingData } from '@/actions/billing';
import type { UserBillingData } from '@/entities/billing/billing';

interface UseBillingDataReturn {
  billingData: UserBillingData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBillingData(): UseBillingDataReturn {
  const [billingData, setBillingData] = useState<UserBillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingData = async () => {
    setIsLoading(true);
    setError(null);
    const data = await getUserBillingData();
    if (data.success) {
      setBillingData(data.data);
    } else {
      setError(data.error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  return {
    billingData,
    isLoading,
    error,
    refetch: fetchBillingData,
  };
}
