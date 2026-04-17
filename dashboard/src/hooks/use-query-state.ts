import { useRef } from 'react';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

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
 * Pass `enabled` for lazily-enabled queries (e.g. tab-gated). If the query was
 * disabled when the input changed, its placeholder data is stale on re-enable
 * `loading` is true (show a skeleton) rather than `refetching` (show a spinner over
 * existing content). Omitting `enabled` treats all placeholder data as valid.
 *
 * In realtime mode, all refetches are silent (`refetching` stays false).
 */
export function useQueryState<T>(query: QueryLike<T>, enabled = true): QueryState<T> {
  const { interval } = useTimeRangeContext();
  const isRealtime = interval === 'realtime';

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

  // In realtime mode, suppress the spinner entirely
  const refetching = query.isFetching && !query.isPending && !wasDisabled && !isRealtime;

  return {
    data: query.data,
    loading: query.isPending || (query.isFetching && isPlaceholder && wasDisabled),
    refetching,
  };
}
