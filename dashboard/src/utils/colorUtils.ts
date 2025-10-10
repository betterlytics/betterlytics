/**
 * Get a CSS variable’s computed color and convert OKLCH → hex.
 * Works for both direct color strings and CSS variable references.
 */
export function getResolvedHexColor(
  variableName: string,
  element: HTMLElement = document.documentElement,
): string {
  if (typeof window === 'undefined') return '#000000'; // SSR safety

  // If input is not a CSS variable (doesn't start with "var(" or "--"), return as-is
  const isVarRef = variableName.startsWith('var(') || variableName.startsWith('--');
  let raw = variableName;

  if (isVarRef) {
    // Normalize "var(--something)" to "--something"
    const cleanVar = variableName
      .replace(/^var\(/, '')
      .replace(/\)$/, '')
      .trim();
    raw = getComputedStyle(element).getPropertyValue(cleanVar)?.trim();

    if (!raw) {
      console.warn(`CSS variable ${cleanVar} not found on`, element);
      return '#000000';
    }
  }

  const temp = document.createElement('div');
  temp.style.color = raw;
  document.body.appendChild(temp);
  const color = getComputedStyle(temp).color;
  temp.remove();

  const match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (match) {
    const [, r, g, b] = match.map(Number);
    return (
      '#' +
      [r, g, b]
        .map((v) =>
          Math.max(0, Math.min(255, Math.round(v)))
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')
    );
  }

  return color || raw;
}
