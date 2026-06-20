'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useDebounce } from './useDebounce';

export type CSSVariableName = `--${string}`;

/**
 * Neutral gray used when a CSS color variable hasn't resolved yet (e.g. during
 * hydration or a theme switch, when getComputedStyle briefly returns ""). The hook
 * re-runs once next-themes resolves the theme and picks up the real value, so this
 * is only ever shown for a frame in that race rather than crashing the chart.
 */
const FALLBACK_COLOR = '#808080';

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
 * @returns The resolved hex color string, or a neutral fallback if it hasn't resolved yet
 */
function getResolvedHexColor(variableName: CSSVariableName): string {
  if (typeof window === 'undefined') return variableName;

  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();

  if (!value.startsWith('#')) {
    return FALLBACK_COLOR;
  }

  return value;
}
