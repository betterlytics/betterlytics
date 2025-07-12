'use client';

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

export function useSessionRefresh() {
  const { update } = useSession();

  const refreshSession = useCallback(async () => {
    try {
      await update();
      return true;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
  }, [update]);

  return { refreshSession };
}
