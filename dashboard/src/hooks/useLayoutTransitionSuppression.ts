'use client';

import { useLayoutEffect, useState } from 'react';

/**
 * Suppresses CSS transitions for one frame when condition is true.
 * Used to prevent width transitions from animating during layout changes.
 */
export function useLayoutTransitionSuppression(shouldSuppress: boolean): boolean {
  const [isSuppressing, setIsSuppressing] = useState(false);

  useLayoutEffect(() => {
    if (!shouldSuppress) return;

    setIsSuppressing(true);
    const rafId = requestAnimationFrame(() => setIsSuppressing(false));
    return () => cancelAnimationFrame(rafId);
  }, [shouldSuppress]);

  return isSuppressing;
}
