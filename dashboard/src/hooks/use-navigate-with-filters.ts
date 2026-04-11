'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useBARouter } from '@/hooks/use-ba-router';
import { useOptionalDashboardNavigation } from '@/contexts/DashboardNavigationContext';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';

// Params that are page-specific and should NOT be persisted across navigations
const EXCLUDED_PARAMS = ['occurrence'];

/**
 * Hook for navigation that preserves current search parameters (filters)
 */
export function useNavigateWithFilters() {
  const router = useBARouter();
  const searchParams = useSearchParams();
  const navigation = useOptionalDashboardNavigation();
  const { PUBLIC_BASE_URL } = usePublicEnvironmentVariablesContext();

  const resolveHref = useCallback(
    (href: string) => (navigation ? navigation.resolveHref(href) : href),
    [navigation],
  );

  // Use this for actions triggered by button clicks or other client-side events
  const navigate = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      const resolvedHref = resolveHref(href);
      const url = new URL(resolvedHref, PUBLIC_BASE_URL);

      // Preserve current search params if the new URL doesn't have any
      if (!url.search && searchParams?.toString()) {
        const filtered = new URLSearchParams(searchParams.toString());
        EXCLUDED_PARAMS.forEach((p) => filtered.delete(p));
        url.search = filtered.toString();
      }

      const finalUrl = url.pathname + url.search + url.hash;

      if (options?.replace) {
        router.replace(finalUrl);
      } else {
        router.push(finalUrl);
      }
    },
    [resolveHref, router, searchParams, PUBLIC_BASE_URL],
  );

  // Use this for link and/or external navigation
  const getHrefWithFilters = useCallback(
    (href: string): string => {
      const resolvedHref = resolveHref(href);
      const url = new URL(resolvedHref, PUBLIC_BASE_URL);

      // Preserve current search params if the new URL doesn't have any
      if (!url.search && searchParams?.toString()) {
        const filtered = new URLSearchParams(searchParams.toString());
        EXCLUDED_PARAMS.forEach((p) => filtered.delete(p));
        url.search = filtered.toString();
      }

      return url.pathname + url.search + url.hash;
    },
    [resolveHref, searchParams, PUBLIC_BASE_URL],
  );

  return {
    navigate,
    getHrefWithFilters,
  };
}
