'use client';

import { MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import { useCallback, useMemo } from 'react';
import { color as d3color } from 'd3-color';

export type UseDeckGLMapStyleProps = { maxVisitors: number };
export type MapColorScale = ScaleLinear<string, string, never>;

export type DeckGLColor = [number, number, number, number];

export interface DeckGLMapStyle {
  originalStyle: (visitors: number) => { fill: DeckGLColor; line: DeckGLColor };
  selectedStyle: (visitors?: number) => { line: DeckGLColor };
  hoveredStyle: (visitors?: number) => { line: DeckGLColor };
  colorScale: MapColorScale;
  featureBorderColorScale: MapColorScale;
}

function toRgbaTuple(colorOrVar: string, alpha = 255): DeckGLColor {
  let hex = colorOrVar;

  if (colorOrVar.startsWith('var(')) {
    // Extract CSS variable name
    const varName = colorOrVar.slice(4, -1).trim();
    hex = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  const c = d3color(hex)?.rgb();
  if (!c) {
    console.warn('Invalid color:', colorOrVar, 'resolved to:', hex);
    return [0, 0, 0, alpha];
  }

  return [c.r, c.g, c.b, alpha];
}

export function useDeckGLMapStyle({ maxVisitors }: UseDeckGLMapStyleProps): DeckGLMapStyle {
  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, 1, maxVisitors])
        .range([
          MAP_VISITOR_COLORS.NO_VISITORS,
          MAP_VISITOR_COLORS.LOW_VISITORS,
          MAP_VISITOR_COLORS.HIGH_VISITORS,
        ]),
    [maxVisitors],
  );

  const featureBorderColorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, 1, maxVisitors])
        .range([
          MAP_FEATURE_BORDER_COLORS.NO_VISITORS,
          MAP_FEATURE_BORDER_COLORS.LOW_VISITORS,
          MAP_FEATURE_BORDER_COLORS.HIGH_VISITORS,
        ]),
    [maxVisitors],
  );

  const originalStyle = useCallback(
    (visitors?: number) => ({
      fill: toRgbaTuple(colorScale(visitors ?? 0), 200),
      line: toRgbaTuple(featureBorderColorScale(visitors ?? 0), 255),
    }),
    [colorScale, featureBorderColorScale],
  );

  const selectedStyle = useCallback(
    (_visitors?: number) => ({
      line: toRgbaTuple(MAP_FEATURE_BORDER_COLORS.CLICKED, 255),
    }),
    [],
  );

  const hoveredStyle = useCallback(
    (_visitors?: number) => ({
      line: toRgbaTuple(MAP_VISITOR_COLORS.HOVERED, 255),
    }),
    [],
  );
  return { originalStyle, selectedStyle, hoveredStyle, colorScale, featureBorderColorScale };
}
