'use client';

import { MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { ScaleLinear, ScaleLogarithmic, ScalePower, scaleLinear, scaleLog, scalePow } from 'd3-scale';
import { useMemo } from 'react';

export type ScaleType = 'linear' | 'ln' | `log${number}` | `pow-${number}` | `pow-${number}/${number}`;

export type ColorScale =
  | ScaleLinear<string, string, never>
  | ScaleLogarithmic<string, string, never>
  | ScalePower<string, string, never>;
export type UseColorScalesProps = {
  maxVisitors: number;
  scaleType?: ScaleType;
};
export function useColorScales({ maxVisitors, scaleType = 'pow-4/10' }: UseColorScalesProps) {
  const makeScale = (range: [string, string, string]): ColorScale => {
    if (scaleType.startsWith('log') || scaleType === 'ln') {
      const base = scaleType === 'ln' ? Math.E : parseInt(scaleType.slice(3), 10); // extract number after "log"

      return scaleLog<string>()
        .base(base)
        .domain([1, Math.max(1, maxVisitors) / 2, Math.max(1, maxVisitors)])
        .range(range)
        .clamp(true);
    }

    if (scaleType.startsWith('pow-')) {
      const exponentStr = scaleType.replace('pow-', '');
      let exponent: number;

      if (exponentStr.includes('/')) {
        // fraction case, e.g. "1/4"
        const [num, den] = exponentStr.split('/').map(Number);
        exponent = num / den;
      } else {
        // whole number case
        exponent = Number(exponentStr);
      }

      return scalePow<string>().exponent(exponent).domain([0, 1, maxVisitors]).range(range).clamp(true);
    }

    return scaleLinear<string>().domain([0, 1, maxVisitors]).range(range).clamp(true);
  };

  const colorScale = useMemo(
    () =>
      makeScale([
        MAP_VISITOR_COLORS.LOW_VISITORS,
        MAP_VISITOR_COLORS.MEDIUM_VISITORS,
        MAP_VISITOR_COLORS.HIGH_VISITORS,
      ]),
    [scaleType, maxVisitors],
  );

  const borderColorScale = useMemo(
    () =>
      makeScale([
        MAP_FEATURE_BORDER_COLORS.LOW_VISITORS,
        MAP_FEATURE_BORDER_COLORS.MEDIUM_VISITORS,
        MAP_FEATURE_BORDER_COLORS.HIGH_VISITORS,
      ]),
    [scaleType, maxVisitors],
  );

  return { colorScale, borderColorScale };
}
