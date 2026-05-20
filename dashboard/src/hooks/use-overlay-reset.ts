import { useCallback, useRef, type AnimationEvent } from 'react';

export function useOverlayReset(reset: () => void) {
  const pendingRef = useRef(false);
  const resetRef = useRef(reset);
  resetRef.current = reset;

  const markPending = useCallback(() => {
    pendingRef.current = true;
  }, []);

  const onAnimationEnd = useCallback((e: AnimationEvent<HTMLElement>) => {
    const state = e.currentTarget.dataset.state;
    if (state === 'open') {
      pendingRef.current = false;
      return;
    }
    if (state !== 'closed') return;
    if (!pendingRef.current) return;
    pendingRef.current = false;
    resetRef.current();
  }, []);

  return { markPending, onAnimationEnd };
}
