'use client';

import { useMemo } from 'react';
import { scaleLinear, scaleLog, scalePow } from 'd3-scale';
import chroma from 'chroma-js';
import { type CSSVariableName, useCSSColors } from './use-css-colors';

export type ScaleType =
  | 'linear'
  | 'lab'
  | 'ln'
  | `log${number}`
  | `pow-${number}`
  | `pow-${number}/${number}`
  | `gamma-${number}`
  | `gamma-${number}/${number}`;

export type UseColorScaleProps = {
  maxValue: number;
  /** Array of resolved color values (hex, rgb, or rgba) - at least 2 colors required */
  colors: CSSVariableName[];
  scaleType?: ScaleType;
};

export type ColorScale = (value: number) => string;

export function useColorScale({
  colors: colorVariables,
  maxValue,
  scaleType = 'pow-4/10',
}: UseColorScaleProps): ColorScale {
  const colors = useCSSColors(colorVariables);

  return useMemo(() => {
    if (scaleType === 'lab') {
      return (value: number) =>
        chroma
          .scale(colors)
          .mode('lab')(value / (maxValue || 1))
          .hex();
    }

    // Gamma scale: great for exponentially distributed data (e.g., country visitor counts)
    // gamma < 1 stretches lower values, compresses higher values
    // Example: 'gamma-1/3' for heavy skew (1-1000 where most values are 1-100)
    //          'gamma-1/2' for moderate skew
    if (scaleType.startsWith('gamma-')) {
      const gammaStr = scaleType.replace('gamma-', '');
      let gamma: number;
      if (gammaStr.includes('/')) {
        const [num, den] = gammaStr.split('/').map(Number);
        gamma = num / den;
      } else {
        gamma = Number(gammaStr);
      }

      const scale = chroma
        .scale(colors)
        .mode('lab')
        .domain([1, maxValue || 1])
        .gamma(gamma);

      return (value: number) => scale(Math.max(0, value)).hex();
    }

    if (scaleType.startsWith('log') || scaleType === 'ln') {
      const base = scaleType === 'ln' ? Math.E : parseInt(scaleType.slice(3), 10);

      return scaleLog<string>()
        .base(base)
        .domain(
          Array.from({ length: colors.length }, (_, i) =>
            i === 0 ? 1 : 1 + (Math.max(1, maxValue) - 1) * (i / (colors.length - 1)),
          ),
        )
        .range(colors)
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

      return scalePow<string>()
        .exponent(exponent)
        .domain(Array.from({ length: colors.length }, (_, i) => maxValue * (i / (colors.length - 1))))
        .range(colors)
        .clamp(true);
    }

    return scaleLinear<string>()
      .domain(Array.from({ length: colors.length }, (_, i) => maxValue * (i / (colors.length - 1))))
      .range(colors)
      .clamp(true);
  }, [colors, scaleType, maxValue]);
}
