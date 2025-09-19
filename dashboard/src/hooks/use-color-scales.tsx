'use client';

import { MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { ScaleLinear, ScaleLogarithmic, scaleLinear, scaleLog } from 'd3-scale';
import { useMemo } from 'react';

export const SCALE_TYPES = ['linear', 'log10', 'log5', 'ln', 'log2'] as const;
export type ScaleType = (typeof SCALE_TYPES)[number];
export type ColorScale = ScaleLinear<string, string, never> | ScaleLogarithmic<string, string, never>;
export type UseColorScalesProps = {
  maxVisitors: number;
  scaleType?: ScaleType;
};

export function useColorScales({ maxVisitors, scaleType = 'log10' }: UseColorScalesProps) {
  const makeScale = (range: [string, string, string]): ColorScale => {
    if (scaleType.startsWith('log') || scaleType === 'ln') {
      return scaleLog<string>()
        .base(scaleType === 'ln' ? Math.E : parseInt(scaleType.slice(3), 10))
        .domain([1, Math.max(1, maxVisitors) / 2, Math.max(1, maxVisitors)])
        .range(range)
        .clamp(true);
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
