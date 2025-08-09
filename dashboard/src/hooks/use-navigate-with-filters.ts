'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useBARouter } from '@/hooks/use-ba-router';

/**
 * Hook for navigation that preserves current search parameters (filters)
 */
export function useNavigateWithFilters() {
  const router = useBARouter();
  const searchParams = useSearchParams();

  // Use this for actions triggered by button clicks or other client-side events
  const navigate = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      const url = new URL(href, window.location.origin);

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
    [router, searchParams],
  );

  // Use this for link and/or external navigation
  const getHrefWithFilters = useCallback(
    (href: string): string => {
      const url = new URL(href, window.location.origin);

      // Preserve current search params if the new URL doesn't have any
      if (!url.search && searchParams?.toString()) {
        url.search = searchParams.toString();
      }

      return url.pathname + url.search + url.hash;
    },
    [searchParams],
  );

  return {
    navigate,
    getHrefWithFilters,
  };
}
