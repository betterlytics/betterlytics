import { useEffect, useState } from 'react';

/**
 * Drives a mount-time entrance animation. Returns false on the first paint so
 * offset-hidden initial states render, then flips to true one frame later so CSS
 * transitions trigger.
 */
export function useEntranceAnimation(): boolean {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return animate;
}
