'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useBARouter } from '@/hooks/use-ba-router';
import { useOptionalDashboardNavigation } from '@/contexts/DashboardNavigationContext';

// Params that are page-specific and should NOT be persisted across navigations
const EXCLUDED_PARAMS = ['occurrence', 'tab'];

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

  // Use this for link and/or external navigation
  const getHrefWithFilters = useCallback(
    (href: string): string => {
      const url = new URL(resolveHref(href), 'http://placeholder');

      // Preserve current search params; the new URL's own params take precedence
      const params = new URLSearchParams(searchParams?.toString());
      EXCLUDED_PARAMS.forEach((p) => params.delete(p));
      url.searchParams.forEach((value, key) => params.set(key, value));
      url.search = params.toString();

      return url.pathname + url.search + url.hash;
    },
    [resolveHref, searchParams],
  );

  // Use this for actions triggered by button clicks or other client-side events
  const navigate = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      const finalUrl = getHrefWithFilters(href);

      if (options?.replace) {
        router.replace(finalUrl);
      } else {
        router.push(finalUrl);
      }
    },
    [getHrefWithFilters, router],
  );

  return {
    navigate,
    getHrefWithFilters,
  };
}
