'use client';

import { useMemo } from 'react';
import { ScaleLinear, ScaleLogarithmic, ScalePower, scaleLinear, scaleLog, scalePow } from 'd3-scale';
import { useCSSColors } from './use-css-colors';

const DEFAULT_COLORS = ['var(--graph-fill-low)', 'var(--graph-fill-medium)', 'var(--graph-fill-high)'];

export type ScaleType = 'linear' | 'ln' | `log${number}` | `pow-${number}` | `pow-${number}/${number}`;

export type UseColorScaleProps = {
  maxVisitors: number;
  colors?: string[];
  scaleType?: ScaleType;
};

export type ColorScale =
  | ScaleLinear<string, string, never>
  | ScaleLogarithmic<string, string, never>
  | ScalePower<string, string, never>;

export function useColorScale({
  colors = DEFAULT_COLORS,
  maxVisitors,
  scaleType = 'pow-4/10',
}: UseColorScaleProps): ColorScale | null {
  const cssColors = useCSSColors(...colors);

  return useMemo(() => {
    if (!cssColors || cssColors.length < 3) return null;
    const range = cssColors.slice(0, 3) as [string, string, string];

    if (scaleType.startsWith('log') || scaleType === 'ln') {
      const base = scaleType === 'ln' ? Math.E : parseInt(scaleType.slice(3), 10);

      return scaleLog<string>()
        .base(base)
        .domain([1, ...colors.slice(1).map((_, i) => Math.max(1, maxVisitors) / (colors.length - i))])
        .range(range)
        .clamp(true);
    }

    if (scaleType.startsWith('pow-')) {
      const exponentStr = scaleType.replace('pow-', '');
      let exponent: number;
      if (exponentStr.includes('/')) {
        const [num, den] = exponentStr.split('/').map(Number);
        exponent = num / den;
      } else {
        exponent = Number(exponentStr);
      }

      return scalePow<string>().exponent(exponent).domain([0, 1, maxVisitors]).range(range).clamp(true);
    }

    return scaleLinear<string>().domain([0, 1, maxVisitors]).range(range).clamp(true);
  }, [cssColors, scaleType, maxVisitors]);
}
