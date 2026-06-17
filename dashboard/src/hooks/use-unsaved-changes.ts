'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Tracks whether `state` has diverged from the last point it was marked saved, and warns the user
 * before the browser unloads (refresh, tab close, browser back) while changes are unsaved.
 *
 * `state` is compared by JSON value, so pass a plain serialisable snapshot of exactly the fields
 * that count as a change; derive it (e.g. trim, drop fields the save ignores) so cosmetic edits
 * don't read as dirty. Call `markSaved()` after a successful save to move the baseline forward.
 */
export function useUnsavedChanges<T>(state: T) {
  const serialized = JSON.stringify(state);
  const savedRef = useRef(serialized);
  const isDirty = serialized !== savedRef.current;

  const markSaved = useCallback(() => {
    savedRef.current = JSON.stringify(state);
  }, [state]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return { isDirty, markSaved };
}
