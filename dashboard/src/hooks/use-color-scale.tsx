'use client';

import { useMemo } from 'react';
import { scaleLinear, scaleLog, scalePow } from 'd3-scale';
import { interpolateLab } from 'd3-interpolate';
import { type CSSVariableName, useCSSColors } from './use-css-colors';

export type ScaleType =
  | 'linear'
  | 'lab'
  | `gamma`
  | 'ln'
  | `log${number}`
  | `pow-${number}`
  | `pow-${number}/${number}`;

export type UseColorScaleProps = {
  maxValue: number;
  /** Array of resolved color values (hex, rgb, or rgba) - at least 2 colors required */
  colors: CSSVariableName[];
  scaleType: ScaleType;
};

export type ColorScale = (value: number) => string;

export function useColorScale({ colors: colorVariables, maxValue, scaleType }: UseColorScaleProps): ColorScale {
  const colors = useCSSColors(colorVariables);

  return useMemo(() => {
    if (scaleType === 'lab') {
      const scale = scaleLinear<string>()
        .domain([0, maxValue || 1])
        .interpolate(interpolateLab)
        .range(colors)
        .clamp(true);

      return (value: number) => scale(value);
    }

    // Gamma scale: great for exponentially distributed data (e.g., country visitor counts)
    if (scaleType.startsWith('gamma')) {
      const gamma = 1 / 4;

      const base = scaleLinear<string>()
        .domain([1, maxValue || 1])
        .range(colors)
        .interpolate(interpolateLab);

      return (value: number) => {
        const normalized = (value - 1) / ((maxValue || 1) - 1);
        const adjusted = Math.pow(Math.max(0, normalized), gamma);
        const result = base(1 + adjusted * ((maxValue || 1) - 1));

        return result;
      };
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
