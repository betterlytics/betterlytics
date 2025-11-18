'use client';

import { MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { ScaleLinear } from 'd3-scale';
import type { PathOptions } from 'leaflet';
import { type JSX, useCallback, useMemo } from 'react';
import { ColorScale, useColorScale, UseColorScaleProps } from '@/hooks/use-color-scale';
import { useCSSColors } from '@/hooks/use-css-colors';

export type UseMapStyleProps = Omit<UseColorScaleProps, 'colors'>;
export type FeatureStyle = PathOptions;
export type MapColorScale = ScaleLinear<string, string, never>;

export interface MapStyle {
  originalStyle: (visitors: number) => FeatureStyle;
  selectedStyle: (visitors: number) => FeatureStyle;
  hoveredStyle: (visitors: number) => FeatureStyle;
  LeafletCSS: JSX.Element;
  fillColorScale: ColorScale;
  borderColorScale: ColorScale;
}

export function useMapStyle({ maxValue: maxVisitors, scaleType = 'log10' }: UseMapStyleProps): MapStyle {
  const fillColors = useCSSColors([
    MAP_VISITOR_COLORS.LOW_VISITORS,
    MAP_VISITOR_COLORS.MEDIUM_VISITORS,
    MAP_VISITOR_COLORS.HIGH_VISITORS,
  ] as const);

  const borderColors = useCSSColors([
    MAP_FEATURE_BORDER_COLORS.LOW_VISITORS,
    MAP_FEATURE_BORDER_COLORS.MEDIUM_VISITORS,
    MAP_FEATURE_BORDER_COLORS.HIGH_VISITORS,
  ] as const);

  const fillColorScale = useColorScale({
    maxValue: maxVisitors,
    scaleType,
    colors: fillColors as [string, string, string],
  });

  const borderColorScale = useColorScale({
    maxValue: maxVisitors,
    scaleType,
    colors: borderColors as [string, string, string],
  });

  const originalStyle = useCallback(
    (visitors: number) => ({
      ...(visitors
        ? {
            fillColor: fillColorScale(visitors),
            color: borderColorScale(visitors),
            weight: 1.5,
          }
        : {
            fillColor: MAP_VISITOR_COLORS.NO_VISITORS,
            color: MAP_FEATURE_BORDER_COLORS.NO_VISITORS,
            weight: 0.7,
          }),
      fillOpacity: 0.8,
      opacity: 1,
    }),
    [fillColorScale, borderColorScale],
  );

  const selectedStyle = useCallback(
    (visitors: number) => ({
      ...originalStyle(visitors),
      color: MAP_FEATURE_BORDER_COLORS.CLICKED,
      weight: 2.2,
      fillOpacity: 1,
    }),
    [originalStyle],
  );

  const hoveredStyle = useCallback(
    (visitors: number) => ({
      ...originalStyle(visitors),
      color: MAP_FEATURE_BORDER_COLORS.HOVERED,
      weight: 2.0,
      fillOpacity: 1,
    }),
    [originalStyle],
  );

  const LeafletCSS = useMemo(() => {
    return (
      <style jsx global>
        {`
          .leaflet-container {
            background-color: var(--color-card);
          }
          .leaflet-interactive:focus {
            outline: none !important;
          }
          .leaflet-popup-content {
            margin: 0 0.5rem !important;
            padding: 0 !important;
            display: flex;
            flex-direction: column;
          }
          .leaflet-popup-content,
          .leaflet-popup-tip {
            background-color: var(--color-card);
            filter: drop-shadow(0 0.5px 2px var(--color-sidebar-accent-foreground));
            pointer-events: none;
          }
          .leaflet-popup-content-wrapper {
            background: transparent;
            border: none;
            box-shadow: none;
            padding: 0;
          }
          .leaflet-popup {
            z-index: 11;
            pointer-events: none;
          }
        `}
      </style>
    );
  }, []);

  return { originalStyle, selectedStyle, hoveredStyle, LeafletCSS, fillColorScale, borderColorScale };
}
