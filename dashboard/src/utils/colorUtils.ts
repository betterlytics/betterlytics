export type ColorFormat = 'hsl' | 'rgb';

export interface ColorGenerationOptions {
  /**
   * If a value exists in this map, it will be used instead of generating a color.
   */
  colorMap?: Record<string, string>;
  /**
   * Default color to use if value is not in colorMap and generation fails.
   */
  defaultColor?: string;
  /**
   * Color format to generate.
   * @default 'hsl'
   */
  format?: ColorFormat;
  /**
   * Saturation for HSL colors (0-100).
   * @default 70
   */
  saturation?: number;
  /**
   * Lightness for HSL colors (0-100).
   * @default 50
   */
  lightness?: number;
  /**
   * Use golden ratio for better color distribution.
   * @default true
   */
  useGoldenRatio?: boolean;
}

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateHSLFromHash(
  hash: number,
  saturation: number = 70,
  lightness: number = 50,
  useGoldenRatio: boolean = true,
): string {
  let hue: number;
  if (useGoldenRatio) {
    // Using golden ratio conjugate (0.618...) for better distribution
    hue = (hash * 137.508) % 360;
  } else {
    hue = hash % 360;
  }

  const finalSaturation = saturation + (hash % 20);
  const finalLightness = lightness + (hash % 15);

  return `hsl(${Math.floor(hue)}, ${Math.min(100, finalSaturation)}%, ${Math.min(100, finalLightness)}%)`;
}

function generateRGBFromHash(hash: number): string {
  const r = (hash & 0xff0000) >> 16;
  const g = (hash & 0x00ff00) >> 8;
  const b = hash & 0x0000ff;
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Generate a consistent color for a given string value.
 *
 * @param value - The string value to generate a color for
 * @param options - Configuration options for color generation
 * @returns A color string in the specified format
 *
 * @example
 * ```ts
 * // Basic usage with HSL (default)
 * getColorForValue('campaign-1') // Returns: 'hsl(123, 70%, 50%)'
 *
 * // With predefined color map
 * getColorForValue('mobile', {
 *   colorMap: { mobile: '#22c55e', tablet: '#f59e0b' },
 *   defaultColor: '#9ca3af'
 * })
 *
 * // RGB format
 * getColorForValue('source-1', { format: 'rgb' })
 *
 * // Custom HSL parameters
 * getColorForValue('item', { saturation: 80, lightness: 60 })
 * ```
 */
export function getColorForValue(value: string, options: ColorGenerationOptions = {}): string {
  const {
    colorMap = {},
    defaultColor,
    format = 'hsl',
    saturation = 70,
    lightness = 50,
    useGoldenRatio = true,
  } = options;

  const normalizedValue = value.toLowerCase();

  const mappedColor = colorMap[value] || colorMap[normalizedValue];

  if (mappedColor) {
    return mappedColor;
  }

  const hash = hashString(value);

  try {
    if (format === 'rgb') {
      return generateRGBFromHash(hash);
    } else {
      return generateHSLFromHash(hash, saturation, lightness, useGoldenRatio);
    }
  } catch {
    return defaultColor || (format === 'rgb' ? 'rgb(128, 128, 128)' : 'hsl(0, 0%, 50%)');
  }
}

/**
 * Create a color getter function with predefined options.
 * Useful for creating reusable color functions for specific use cases.
 *
 * @example
 * ```ts
 * const getDeviceColor = createColorGetter({
 *   colorMap: {
 *     mobile: '#22c55e',
 *     ...
 *   },
 *   defaultColor: '#9ca3af'
 * });
 *
 * getDeviceColor('mobile') // '#22c55e'
 * getDeviceColor('unknown') // '#9ca3af'
 * ```
 */
export function createColorGetter(options: ColorGenerationOptions = {}) {
  return (value: string): string => getColorForValue(value, options);
}
