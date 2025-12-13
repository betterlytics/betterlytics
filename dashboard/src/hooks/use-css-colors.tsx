'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useDebounce } from './useDebounce';

export type CSSVariableName = `--${string}`;

/**
 * Reads and resolves a set of CSS color variables into hex strings.
 * @param cssVariables - Array of CSS variable names (e.g., '--my-color')
 * @returns Array of resolved hex color strings
 */
export function useCSSColors(cssVariables: CSSVariableName[]): string[] {
  const { resolvedTheme } = useTheme();

  const deboucedTheme = useDebounce(resolvedTheme, 50);

  const colors = useMemo(() => {
    return cssVariables.map((v) => getResolvedHexColor(v));
  }, [cssVariables.join(','), deboucedTheme]);

  return colors;
}

/**
 * Get a CSS variable's computed hex color value.
 * @param variableName - The CSS variable name (e.g., '--my-color')
 * @returns The resolved hex color string
 * @throws Error if the CSS variable value is not a hex color
 */
function getResolvedHexColor(variableName: CSSVariableName): string {
  if (typeof window === 'undefined') return variableName;

  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();

  if (!value.startsWith('#')) {
    throw new Error(`CSS variable "${variableName}" must be a hex color for interpolation, got: "${value}"`);
  }

  return value;
}
