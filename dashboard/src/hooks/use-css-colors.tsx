'use client';

import { useMemo } from 'react';
import { getResolvedHexColor } from '@/utils/colorUtils';

type CSSVariableName = `--${string}`;

/**
 * Reads and resolves a set of CSS color variables into hex strings.
 * @param cssVariables - Array of CSS variable names (e.g., '--my-color')
 * @returns Array of resolved hex color strings
 */
export function useCSSColors(
  cssVariables: CSSVariableName[] | readonly CSSVariableName[],
): string[] {
  const colors = useMemo(() => {
    return cssVariables.map((v) => getResolvedHexColor(v));
  }, [cssVariables]);

  return colors;
}
