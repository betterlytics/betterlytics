const colorCache = new Map<string, string>();

let colorTestElement: HTMLDivElement | null = null;

function getColorTestElement(): HTMLDivElement {
  if (!colorTestElement) {
    colorTestElement = document.createElement('div');
    colorTestElement.style.display = 'none';
    document.body.appendChild(colorTestElement);
  }
  return colorTestElement;
}

/**
 * Clear the color cache
 */
export function clearColorCache(): void {
  colorCache.clear();
}

/**
 * Get a CSS variable's computed color and convert OKLCH → hex.
 * Works for both direct color strings and CSS variable references.
 * @param variableName - The CSS variable name (e.g., '--my-color') or direct color string (e.g., '#ff0000', 'rgb(255, 0, 0)')
 * @param element - The HTML element to get the CSS variable from (defaults to document.documentElement)
 * @returns The resolved hex color string (e.g., '#rrggbbaa'), or the original input if not a CSS-variable.
 */
export function getResolvedHexColor(
  variableName: string,
  element: HTMLElement = document.documentElement,
): string {
  if (typeof window === 'undefined') return variableName;

  // If input is not a CSS variable (doesn't start with "var(" or "--"), return as-is
  const isCssVariable = variableName.startsWith('var(') || variableName.startsWith('--');

  if (!isCssVariable) {
    return variableName;
  }

  // Normalize "var(--something)" to "--something"
  const cleanVar = variableName
    .replace(/^var\(/, '')
    .replace(/\)$/, '')
    .trim();

  const cacheKey = `${cleanVar}:${element.tagName}`;
  if (colorCache.has(cacheKey)) {
    return colorCache.get(cacheKey)!;
  }

  const raw = getComputedStyle(element).getPropertyValue(cleanVar)?.trim();

  if (!raw) {
    return variableName;
  }

  const testEl = getColorTestElement();
  testEl.style.color = raw;
  const color = getComputedStyle(testEl).color;

  const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  let result: string;

  if (match) {
    const [, r, g, b, a] = match;
    const alpha = a !== undefined ? Math.round(parseFloat(a) * 255) : 255;

    const hex =
      '#' +
      [Number(r), Number(g), Number(b), alpha]
        .map((v) =>
          Math.max(0, Math.min(255, Math.round(v)))
            .toString(16)
            .padStart(2, '0'),
        )
        .join('');

    result = alpha === 255 ? hex.slice(0, 7) : hex;
  } else {
    result = color;
  }

  colorCache.set(cacheKey, result);
  return result;
}
