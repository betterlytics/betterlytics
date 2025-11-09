'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useBARouter } from '@/hooks/use-ba-router';
import { useOptionalDashboardNavigation } from '@/contexts/DashboardNavigationContext';

/**
 * Hook for navigation that preserves current search parameters (filters)
 */
export function useNavigateWithFilters() {
  const router = useBARouter();
  const searchParams = useSearchParams();
  const navigation = useOptionalDashboardNavigation();

  const resolveHref = useCallback(
    (href: string) => (navigation ? navigation.resolveHref(href) : href),
    [navigation],
  );

  // Use this for actions triggered by button clicks or other client-side events
  const navigate = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      const resolvedHref = resolveHref(href);
      const url = new URL(resolvedHref, window.location.origin);

      // Preserve current search params if the new URL doesn't have any
      if (!url.search && searchParams?.toString()) {
        url.search = searchParams.toString();
      }

      const finalUrl = url.pathname + url.search + url.hash;

      if (options?.replace) {
        router.replace(finalUrl);
      } else {
        router.push(finalUrl);
      }
    },
    [resolveHref, router, searchParams],
  );

  // Use this for link and/or external navigation
  const getHrefWithFilters = useCallback(
    (href: string): string => {
      const resolvedHref = resolveHref(href);
      const url = new URL(resolvedHref, window.location.origin);

      // Preserve current search params if the new URL doesn't have any
      if (!url.search && searchParams?.toString()) {
        url.search = searchParams.toString();
      }

      return url.pathname + url.search + url.hash;
    },
    [resolveHref, searchParams],
  );

  return {
    navigate,
    getHrefWithFilters,
  };
}
