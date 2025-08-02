'use client';

import { useEffect } from 'react';
import { useBARouter } from '@/hooks/use-ba-router';
import { useSessionRefresh } from '@/hooks/use-session-refresh';

interface VerificationRedirectHandlerProps {
  hasSession: boolean;
}

export function VerificationRedirectHandler({ hasSession }: VerificationRedirectHandlerProps) {
  const { refreshSession } = useSessionRefresh();
  const router = useBARouter();

  useEffect(() => {
    const handleRedirect = async () => {
      if (hasSession) {
        // Refresh session to update emailVerified status in session token before redirect
        await refreshSession();
        router.push('/dashboards?verified=1');
      } else {
        router.push('/signin?verified=1');
      }
    };

    handleRedirect();
  }, [hasSession, refreshSession, router]);

  return null;
}
