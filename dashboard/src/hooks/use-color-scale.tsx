'use client';

import { useMemo } from 'react';
import { scaleLinear, scaleLog, scalePow } from 'd3-scale';
import chroma from 'chroma-js';

export type ScaleType = 'linear' | 'lab' | 'ln' | `log${number}` | `pow-${number}` | `pow-${number}/${number}`;

export type UseColorScaleProps = {
  maxValue: number;
  /** Array of resolved color values (hex, rgb, or rgba) - at least 2 colors required */
  colors: [string, string, ...string[]];
  scaleType?: ScaleType;
};

export type ColorScale = (value: number) => string;

export function useColorScale({ colors, maxValue, scaleType = 'pow-4/10' }: UseColorScaleProps): ColorScale {
  return useMemo(() => {
    if (scaleType === 'lab') {
      return (value: number) =>
        chroma
          .scale(colors)
          .correctLightness(true)
          .mode('lab')(value / (maxValue || 1))
          .hex();
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
