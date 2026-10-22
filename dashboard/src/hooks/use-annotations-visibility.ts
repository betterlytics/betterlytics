'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDashboardId } from '@/hooks/use-dashboard-id';

/**
 * Per-dashboard, per-browser choice to show or hide chart annotations.
 */
export function useAnnotationsVisibility() {
  const dashboardId = useDashboardId();
  const storageKey = `annotations-visible-${dashboardId}`;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(localStorage.getItem(storageKey) !== 'false');
  }, [storageKey]);

  const toggleVisible = useCallback(() => {
    setIsVisible(!isVisible);
    localStorage.setItem(storageKey, String(!isVisible));
  }, [isVisible, storageKey]);

  return { isVisible, toggleVisible };
}
