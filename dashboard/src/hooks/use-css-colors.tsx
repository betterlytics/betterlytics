'use client';

import { useEffect, useState } from 'react';
import { getResolvedHexColor } from '@/utils/colorUtils';

/**
 * Reads and resolves a set of CSS color variables into hex strings.
 */
export function useCSSColors(...vars: string[]): string[] | null {
  const [colors, setColors] = useState<string[] | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Wait for CSS to load / theme toggle to apply
    const update = () => {
      const resolved = vars.map((v) => getResolvedHexColor(v));
      setColors(resolved);
    };

    requestAnimationFrame(update);

    // re-run on theme change
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [vars.join()]);

  return colors;
}
