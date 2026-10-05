'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export function replaceSearchParam(search: string, key: string, next: string | undefined): string | null {
  const params = new URLSearchParams(search);
  const current = params.get(key) ?? undefined;
  const wanted = next || undefined;
  if (current === wanted) return null;
  if (wanted) {
    params.set(key, wanted);
  } else {
    params.delete(key);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

// Native replaceState keeps useSearchParams in sync without an RSC refetch or a history entry
export function useReplaceStateParam(key: string) {
  const value = useSearchParams()?.get(key) ?? undefined;

  const set = useCallback(
    (next: string | undefined) => {
      const search = replaceSearchParam(window.location.search, key, next);
      if (search === null) return;
      window.history.replaceState(null, '', `${window.location.pathname}${search}`);
    },
    [key],
  );

  return [value, set] as const;
}
