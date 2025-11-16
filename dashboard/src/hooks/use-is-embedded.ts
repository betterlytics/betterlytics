'use client';

import { useEffect, useState } from 'react';

export function useIsEmbedded(): boolean {
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setIsEmbedded(window.self !== window.top);
    } catch {
      setIsEmbedded(true);
    }
  }, []);

  return isEmbedded;
}
