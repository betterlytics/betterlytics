'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { checkStatusPageSlugAction } from '@/app/actions/analytics/statusPage.actions';
import { type SlugStatus } from './constants';

type UseSlugAvailabilityParams = {
  dashboardId: string;
  slug: string;
  /** Existing page id to exclude from the taken check (so its own slug doesn't count as taken). */
  excludeStatusPageId?: string;
  /** The page's saved slug. While the input still equals it, the slug reports 'idle' (no check). */
  currentSlug?: string;
  debounceMs?: number;
};

export function useSlugAvailability({
  dashboardId,
  slug,
  excludeStatusPageId,
  currentSlug,
  debounceMs = 500,
}: UseSlugAvailabilityParams): SlugStatus {
  const [status, setStatus] = useState<SlugStatus>('idle');
  const debouncedSlug = useDebounce(slug, debounceMs);

  useEffect(() => {
    if (currentSlug != null && debouncedSlug === currentSlug) {
      setStatus('idle');
      return;
    }
    let cancelled = false;
    setStatus('checking');
    checkStatusPageSlugAction(dashboardId, debouncedSlug, excludeStatusPageId).then((result) => {
      if (cancelled) return;
      setStatus(result.available ? 'available' : result.reason === 'taken' ? 'taken' : 'invalid');
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedSlug, dashboardId, excludeStatusPageId, currentSlug]);

  if (currentSlug != null && slug === currentSlug) return 'idle';
  if (slug !== debouncedSlug) return 'checking';
  return status;
}
