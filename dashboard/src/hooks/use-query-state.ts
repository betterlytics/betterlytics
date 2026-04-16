import { useRef } from 'react';

type QueryLike<T> = {
  isPending: boolean;
  isFetching: boolean;
  isPlaceholderData?: boolean;
  data: T | undefined;
};

type QueryState<T> = {
  data: T | undefined;
  /** True on initial load — no data has been received yet. Show a skeleton. */
  loading: boolean;
  /** True when refetching over existing data (e.g. time range change). Show a spinner overlay. */
  refetching: boolean;
};

/**
 * Derives loading/refetching state from a React Query result.
 *
 * Pass `enabled` for lazily-enabled queries (e.g. tab-gated). When a query was
 * disabled while the input changed, the placeholder data it receives on re-enable
 * is stale `loading` will be true (skeleton) instead of `refetching` (spinner).
 * Without `enabled`, placeholder data is treated as valid.
 */
export function useQueryState<T>(query: QueryLike<T>, enabled = true): QueryState<T> {
  // Tracks whether this query was disabled at any point during the current fetch cycle.
  const wasDisabledRef = useRef(!enabled);

  if (!enabled) {
    wasDisabledRef.current = true;
  } else if (!query.isFetching || !query.isPlaceholderData) {
    // Clear once fresh data has arrived or there is no placeholder to worry about.
    wasDisabledRef.current = false;
  }

  const wasDisabled = wasDisabledRef.current;
  const isPlaceholder = query.isPlaceholderData ?? false;

  return {
    data: query.data,
    loading: query.isPending || (query.isFetching && isPlaceholder && wasDisabled),
    refetching: query.isFetching && !query.isPending && !wasDisabled,
  };
}
