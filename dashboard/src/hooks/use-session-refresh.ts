'use client';

import { authClient } from '@/lib/auth-client';
import { useCallback } from 'react';

export function useSessionRefresh() {
  const { refetch } = authClient.useSession();

  const refreshSession = useCallback(async () => {
    try {
      await refetch();
      return true;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
  }, [refetch]);

  return { refreshSession };
}
