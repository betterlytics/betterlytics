'use client';
import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { classifyAuthError, type AuthClientError } from '@/lib/auth/auth-error';

/**
 * Returns the shared copy for non-credential auth errors, or null so the form applies its own mapping.
 * Call it from event handlers only: the origin message reads window.location.
 */
export function useAuthErrorMessage() {
  const t = useTranslations('public.auth.errors');

  return useCallback(
    (error: AuthClientError): string | null => {
      switch (classifyAuthError(error)) {
        case 'originMismatch':
          return t('originMismatch', { origin: window.location.origin });
        case 'accountLocked':
          return t('accountLocked');
        case 'rateLimited':
          return t('rateLimited');
        case 'other':
          return null;
      }
    },
    [t],
  );
}
