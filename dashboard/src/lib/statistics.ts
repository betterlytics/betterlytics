import { scaleLinear } from 'd3-scale';

/**
 * Computes the q-th quantile of an array of numbers using linear interpolation.
 * @param values Array of numbers
 * @param q Quantile to compute (0..1)
 * @returns The interpolated quantile value
 */
export function interpolatedQuantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);

  if (sorted[base + 1] !== undefined) {
    return sorted[base] + (pos - base) * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}

/**
 * Computes a normalized maximum value for a range of numbers,
 * based on a quantile cutoff to reduce outlier influence.
 */
export function computeNormalizedMax(values: number[], hiQuantile: number): number {
  if (values.length === 0) return 1;
  const maxRaw = Math.max(...values, 1);
  if (values.length <= 10) return maxRaw;

  const q = interpolatedQuantile(values, hiQuantile);
  return Math.max(q, 1);
}

/**
 * Rounds up a maximum value to a "nice" human-readable number.
 *
 * Uses D3's `scaleLinear().nice()` under the hood, which adjusts the domain
 * so that values are cleanly rounded.
 *
 * Examples:
 * - niceMax(604.3222) → 700
 * - niceMax(9732) → 10000
 * - niceMax(0.84) → 1
 *
 * @param value The raw maximum value
 * @returns A rounded "nice" maximum value suitable for human-eyes to read.
 */
export function niceMax(value: number): number {
  return scaleLinear().domain([0, value]).nice().domain()[1];
}
