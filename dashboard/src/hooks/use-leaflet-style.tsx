'use client';

import { MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { ScaleLinear } from 'd3-scale';
import type { PathOptions } from 'leaflet';
import { type JSX, useCallback, useMemo } from 'react';
import { ColorScale, useColorScale, UseColorScaleProps } from '@/hooks/use-color-scale';

export type UseMapStyleProps = Omit<UseColorScaleProps, 'colors'>;
export type FeatureStyle = PathOptions;
export type MapColorScale = ScaleLinear<string, string, never>;

export interface MapStyle {
  originalStyle: (visitors: number) => FeatureStyle;
  selectedStyle: (visitors: number) => FeatureStyle;
  hoveredStyle: (visitors: number) => FeatureStyle;
  LeafletCSS: JSX.Element;
  fillColorScale: ColorScale | null;
  borderColorScale: ColorScale | null;
}

export function useMapStyle({ maxVisitors, scaleType = 'log10' }: UseMapStyleProps): MapStyle {
  const fillColorScale = useColorScale({
    maxVisitors,
    scaleType,
    colors: [
      MAP_VISITOR_COLORS.LOW_VISITORS,
      MAP_VISITOR_COLORS.MEDIUM_VISITORS,
      MAP_VISITOR_COLORS.HIGH_VISITORS,
    ],
  });

  const borderColorScale = useColorScale({
    maxVisitors,
    scaleType,
    colors: [
      MAP_FEATURE_BORDER_COLORS.LOW_VISITORS,
      MAP_FEATURE_BORDER_COLORS.MEDIUM_VISITORS,
      MAP_FEATURE_BORDER_COLORS.HIGH_VISITORS,
    ],
  });

  const originalStyle = useCallback(
    (visitors: number) => ({
      ...(visitors
        ? {
            fillColor: fillColorScale?.(visitors) ?? MAP_VISITOR_COLORS.NO_VISITORS,
            color: borderColorScale?.(visitors) ?? MAP_FEATURE_BORDER_COLORS.NO_VISITORS,
            weight: 0.6,
          }
        : {
            fillColor: MAP_VISITOR_COLORS.NO_VISITORS,
            color: MAP_FEATURE_BORDER_COLORS.NO_VISITORS,
            weight: 0.5,
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
      weight: 1.5,
      fillOpacity: 1,
    }),
    [originalStyle],
  );

  const hoveredStyle = useCallback(
    (visitors: number) => ({
      ...selectedStyle(visitors),
      color: MAP_FEATURE_BORDER_COLORS.HOVERED,
    }),
    [selectedStyle],
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
