'use client';

import { useEffect, useState } from 'react';
import { getResolvedHexColor, clearColorCache } from '@/utils/colorUtils';

/**
 * Reads and resolves a set of CSS color variables into hex strings.
 * @param cssVariables - Array of CSS variable names (e.g., 'var(--my-color)')
 * @returns Array of resolved hex color strings
 */
export function useCSSColors(cssVariables: string[] | readonly string[]): string[] | null {
  const [colors, setColors] = useState<string[]>([...cssVariables]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => {
      const resolved = cssVariables.map((v) => getResolvedHexColor(v));
      setColors(resolved);
    };

    const handleThemeChange = () => {
      clearColorCache();
      update();
    };

    const rAF = requestAnimationFrame(update);

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rAF);
    };
  }, [cssVariables.join()]);

  return colors;
}
