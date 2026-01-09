'use client';

import { useLayoutEffect, useState } from 'react';

/**
 * Suppresses CSS transitions for one frame when condition becomes true.
 * Returns true on the first frame, then false after RAF.
 * Initializes to match shouldSuppress for correct first render.
 */
export function useLayoutTransitionSuppression(shouldSuppress: boolean): boolean {
  // Initialize to shouldSuppress so first render is correct
  const [isSuppressing, setIsSuppressing] = useState(shouldSuppress);

  useLayoutEffect(() => {
    if (!shouldSuppress) {
      setIsSuppressing(false);
      return;
    }

    setIsSuppressing(true);
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsSuppressing(false));
    });
    return () => cancelAnimationFrame(rafId);
  }, [shouldSuppress]);

  return isSuppressing;
}

