'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDashboardId } from '@/hooks/use-dashboard-id';

/**
 * Per-dashboard, per-browser choice to show or hide chart annotations.
 * `isVisible` is null until the stored value has been read after mount.
 */
export function useAnnotationsVisibility() {
  const dashboardId = useDashboardId();
  const storageKey = `annotations-visible-${dashboardId}`;
  const [isVisible, setIsVisible] = useState<boolean | null>(null);

  useEffect(() => {
    setIsVisible(localStorage.getItem(storageKey) !== 'false');
  }, [storageKey]);

  const toggleVisible = useCallback(() => {
    const next = isVisible === false;
    setIsVisible(next);
    localStorage.setItem(storageKey, String(next));
  }, [isVisible, storageKey]);

  return { isVisible, toggleVisible };
}
