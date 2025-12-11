'use client';

import { cssVar, MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
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
  fillColorScale: ColorScale;
  borderColorScale: ColorScale;
}

export function useMapStyle({ maxValue: maxVisitors, scaleType = 'gamma-1/4' }: UseMapStyleProps): MapStyle {
  const fillColorScale = useColorScale({
    maxValue: maxVisitors,
    scaleType: scaleType,
    colors: [MAP_VISITOR_COLORS.LOW_VISITORS, MAP_VISITOR_COLORS.HIGH_VISITORS],
  });

  const borderColorScale = useColorScale({
    maxValue: maxVisitors,
    scaleType: scaleType,
    colors: [MAP_FEATURE_BORDER_COLORS.LOW_VISITORS, MAP_FEATURE_BORDER_COLORS.HIGH_VISITORS],
  });

  const originalStyle = useCallback(
    (visitors: number) => ({
      ...(visitors
        ? {
            fillColor: fillColorScale(visitors),
            color: borderColorScale(visitors),
            weight: 1,
          }
        : {
            fillColor: cssVar(MAP_VISITOR_COLORS.NO_VISITORS),
            color: cssVar(MAP_FEATURE_BORDER_COLORS.NO_VISITORS),
            weight: 0.6,
          }),
      fillOpacity: 0.8,
      opacity: 1,
    }),
    [fillColorScale, borderColorScale],
  );

  const selectedStyle = useCallback(
    (visitors: number) => ({
      ...originalStyle(visitors),
      color: cssVar(MAP_FEATURE_BORDER_COLORS.CLICKED),
      weight: 2.2,
      fillOpacity: 1,
    }),
    [originalStyle],
  );

  const hoveredStyle = useCallback(
    (visitors: number) => ({
      ...originalStyle(visitors),
      color: cssVar(MAP_FEATURE_BORDER_COLORS.HOVERED),
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
            margin: 0 !important;
            padding: 0 !important;
            display: flex;
            flex-direction: column;
          }
          .map-sticky-tooltip .leaflet-popup-content {
            border-radius: 1rem;
            overflow: hidden;
          }
          .leaflet-popup-content,
          .leaflet-popup-tip {
            background-color: var(--color-card);
            filter: drop-shadow(0 0.5px 1px var(--color-sidebar-accent-foreground));
          }
          .map-sticky-tooltip .leaflet-popup-content,
          .map-sticky-tooltip .leaflet-popup-tip {
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
          }
        `}
      </style>
    );
  }, []);

  return { originalStyle, selectedStyle, hoveredStyle, LeafletCSS, fillColorScale, borderColorScale };
}
