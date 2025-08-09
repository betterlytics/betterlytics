'use client';

import { MAP_FEATURE_BORDER_COLORS, MAP_VISITOR_COLORS } from '@/constants/mapColors';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import 'leaflet/dist/leaflet.css';
import { type JSX, useCallback, useMemo } from 'react';
import type { PathOptions } from 'leaflet';

export interface UseMapStyleProps {
  calculatedMaxVisitors: number;
  size: 'sm' | 'lg';
}
export type FeatureStyle = PathOptions;
export type MapColorScale = ScaleLinear<string, string, never>;

export interface MapStyle {
  originalStyle: (visitors: number) => FeatureStyle;
  selectedStyle: (visitors: number) => FeatureStyle;
  hoveredStyle: (visitors: number) => FeatureStyle;
  colorScale: MapColorScale;
  featureBorderColorScale: MapColorScale;
  LeafletCSS: JSX.Element;
}

export function useLeafletStyle({ calculatedMaxVisitors, size }: UseMapStyleProps): MapStyle {
  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, 1, calculatedMaxVisitors])
      .range([MAP_VISITOR_COLORS.NO_VISITORS, MAP_VISITOR_COLORS.LOW_VISITORS, MAP_VISITOR_COLORS.HIGH_VISITORS]);
  }, [calculatedMaxVisitors]);

  const featureBorderColorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, 1, calculatedMaxVisitors])
      .range([
        MAP_FEATURE_BORDER_COLORS.NO_VISITORS,
        MAP_FEATURE_BORDER_COLORS.LOW_VISITORS,
        MAP_FEATURE_BORDER_COLORS.HIGH_VISITORS,
      ]);
  }, [calculatedMaxVisitors]);

  const originalStyle = useCallback(
    (visitors: number) => ({
      fillColor: colorScale(visitors),
      color: featureBorderColorScale(visitors),
      weight: visitors ? 1.5 : 1,
      fillOpacity: 0.8,
      opacity: 1,
    }),
    [featureBorderColorScale, colorScale],
  );

  const selectedStyle = useCallback(
    (visitors: number) => ({
      ...originalStyle(visitors),
      color: MAP_FEATURE_BORDER_COLORS.SELECTED,
      weight: 2,
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
            pointer-events: none;
          }
        `}
      </style>
    );
  }, []);

  return { originalStyle, selectedStyle, hoveredStyle, colorScale, featureBorderColorScale, LeafletCSS };
}
