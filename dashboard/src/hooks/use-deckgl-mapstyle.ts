'use client';

import { MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import { useCallback, useMemo } from 'react';
import { color as d3color } from 'd3-color';

export type UseDeckGLMapStyleProps = { calculatedMaxVisitors: number };
export type MapColorScale = ScaleLinear<string, string, never>;

export type DeckGLColor = [number, number, number, number];

export interface DeckGLMapStyle {
  originalStyle: (visitors: number) => { fill: DeckGLColor; line: DeckGLColor };
  selectedStyle: (visitors: number) => { fill: DeckGLColor; line: DeckGLColor };
  hoveredStyle: (visitors: number) => { fill: DeckGLColor; line: DeckGLColor };
  colorScale: MapColorScale;
  featureBorderColorScale: MapColorScale;
}

function toRgbaTuple(hex: string, alpha = 255): DeckGLColor {
  const c = d3color(hex)!;
  return [c.r, c.g, c.b, alpha];
}

export function useDeckGLMapStyle({ calculatedMaxVisitors }: UseDeckGLMapStyleProps): DeckGLMapStyle {
  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, 1, calculatedMaxVisitors])
        .range([
          MAP_VISITOR_COLORS.NO_VISITORS,
          MAP_VISITOR_COLORS.LOW_VISITORS,
          MAP_VISITOR_COLORS.HIGH_VISITORS,
        ]),
    [calculatedMaxVisitors],
  );

  const featureBorderColorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, 1, calculatedMaxVisitors])
        .range([
          MAP_FEATURE_BORDER_COLORS.NO_VISITORS,
          MAP_FEATURE_BORDER_COLORS.LOW_VISITORS,
          MAP_FEATURE_BORDER_COLORS.HIGH_VISITORS,
        ]),
    [calculatedMaxVisitors],
  );

  const originalStyle = useCallback(
    (visitors: number) => ({
      fill: toRgbaTuple(colorScale(visitors), 200),
      line: toRgbaTuple(featureBorderColorScale(visitors), 255),
    }),
    [colorScale, featureBorderColorScale],
  );

  const selectedStyle = useCallback(
    (visitors: number) => ({
      ...originalStyle(visitors),
      line: toRgbaTuple(MAP_FEATURE_BORDER_COLORS.CLICKED, 255),
      fill: toRgbaTuple(colorScale(visitors), 255),
    }),
    [originalStyle, colorScale],
  );

  const hoveredStyle = useCallback(
    (visitors: number) => ({
      ...selectedStyle(visitors),
      line: toRgbaTuple(MAP_FEATURE_BORDER_COLORS.HOVERED, 255),
    }),
    [selectedStyle],
  );

  return { originalStyle, selectedStyle, hoveredStyle, colorScale, featureBorderColorScale };
}
