/**
 * Get a CSS variable's computed hex color value.
 * @param variableName - The CSS variable name (e.g., '--my-color')
 * @returns The resolved hex color string
 * @throws Error if the CSS variable value is not a hex color
 */
export function getResolvedHexColor(variableName: `--${string}`): string {
  if (typeof window === 'undefined') return variableName;

  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();

  if (!value.startsWith('#')) {
    throw new Error(
      `CSS variable "${variableName}" must be a hex color for interpolation, got: "${value}"`,
    );
  }

  return value;
}
