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

const GAMMA = 1 / 4;

// Gamma scale: great for exponentially distributed data (e.g., country visitor counts)
export function createGammaScale(colors: string[], maxValue: number): ColorScale {
  const scale = scaleLinear<string>().domain([0, 1]).range(colors).interpolate(interpolateLab).clamp(true);
  const span = maxValue - 1;

  return (value: number) => {
    const normalized = span > 0 ? (value - 1) / span : value >= 1 ? 1 : 0;
    return scale(Math.pow(Math.max(0, normalized), GAMMA));
  };
}

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

    if (scaleType.startsWith('gamma')) {
      return createGammaScale(colors, maxValue);
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
