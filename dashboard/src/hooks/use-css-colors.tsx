'use client';

import { useEffect, useState } from 'react';
import { getResolvedHexColor } from '@/utils/colorUtils';

/**
 * Reads and resolves a set of CSS color variables into hex strings.
 * @param cssVariables - Array of CSS variable names (e.g., 'var(--my-color)')
 * @param nullColor - Fallback color to use while loading, should not be a css variable. Default: white
 * @returns Array of resolved hex color strings
 */
export function useCSSColors({
  cssVariables,
  nullColor = '#FFFFFF',
}: {
  nullColor?: string;
  cssVariables: string[];
}): string[] | null {
  const [colors, setColors] = useState<string[]>(Array.from({ length: cssVariables.length }, () => nullColor));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Wait for CSS to load / theme toggle to apply
    const update = () => {
      const resolved = cssVariables.map((v) => getResolvedHexColor(v));
      setColors(resolved);
    };

    requestAnimationFrame(update);

    // re-run on theme change
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [cssVariables.join()]);

  return colors;
}
