import type { FeatureCollection } from 'geojson';
import { DeckGLMapStyle, useDeckGLMapStyle } from '@/hooks/use-deckgl-mapstyle';
import { useMapSelectionState } from '@/contexts/DeckGLSelectionContextProvider';
import { useMemo } from 'react';
import { GeoJsonLayer, type GeoJsonLayerProps, PathLayer } from '@deck.gl/layers';

export type GeoJsonAnimation = {
  duration: number;
  easing: (t: number) => number;
};

export type CountriesLayerProps = {
  geojson: FeatureCollection | null;
  visitorData: Record<string, number>;
  fillAnimation?: GeoJsonAnimation;
  outlineAnimation?: GeoJsonAnimation;
  style: DeckGLMapStyle;
  frame: number;
};

export function CountriesLayer({
  geojson,
  visitorData,
  style,
  frame,
  fillAnimation,
  outlineAnimation,
}: CountriesLayerProps) {
  const { hovered: hoveredFeature, clicked: clickedFeature } = useMapSelectionState();

  const outlineCache = useMemo(() => {
    const map = new Map<string, Array<{ path: number[][] }>>();
    if (!geojson) return map;

    for (const f of geojson.features) {
      const iso = f.id as string;
      const entries: Array<{ path: number[][] }> = [];
      if (f.geometry.type === 'Polygon') {
        entries.push({ path: (f.geometry.coordinates as number[][][])[0] });
      } else if (f.geometry.type === 'MultiPolygon') {
        (f.geometry.coordinates as number[][][][]).forEach((poly) => entries.push({ path: poly[0] }));
      }
      map.set(iso, entries);
    }
    return map;
  }, [geojson]);

  const fillLayer = useMemo(() => {
    if (!geojson) return null;

    return new GeoJsonLayer({
      id: 'countries-fill',
      data: geojson,
      filled: true,
      stroked: false,
      pickable: true,

      getFillColor: (f: any) => {
        const iso = f.id as string;
        const visitors = visitorData[iso] ?? 0;
        return style.originalStyle(visitors).fill;
      },
      transitions: {
        getFillColor: fillAnimation,
      },
      updateTriggers: {
        getFillColor: frame,
      },
    });
  }, [geojson, frame, visitorData, style]);

  // static country borders
  const strokeBaseLayer = useMemo(() => {
    if (!geojson) return null;

    return new GeoJsonLayer({
      id: 'countries-stroke',
      data: geojson,
      filled: false,
      stroked: true,
      pickable: false,
      lineWidthMinPixels: 1,

      getLineColor: (f: any) => {
        const iso = f.id as string;
        const visitors = visitorData[iso] ?? 0;
        return style.originalStyle(visitors).line;
      },
      transitions: {
        getLineColor: outlineAnimation,
      },
      updateTriggers: {
        getLineColor: frame,
      },
    });
  }, [geojson, visitorData, style, frame]);

  const clickedPathData = useMemo(
    () => (clickedFeature ? (outlineCache.get(clickedFeature.geoVisitor.country_code) ?? []) : []),
    [outlineCache, clickedFeature?.geoVisitor.country_code],
  );

  const clickedLayer = useMemo(() => {
    if (!clickedPathData.length) return null;

    return new PathLayer({
      id: 'clicked-outline',
      data: clickedPathData,
      pickable: false,
      getPath: (f: any) => f.path,
      getColor: style.selectedStyle(1).line,
      getWidth: 2,
      widthUnits: 'pixels',
      widthMinPixels: 2,
      parameters: { depthTest: false }, // keep visible over fill
      updateTriggers: {
        getColor: clickedFeature?.geoVisitor?.country_code,
      },
    });
  }, [clickedPathData, clickedFeature?.geoVisitor?.country_code, style]);

  const hoverPathData = useMemo(
    () => (hoveredFeature ? (outlineCache.get(hoveredFeature.geoVisitor.country_code) ?? []) : []),
    [outlineCache, hoveredFeature?.geoVisitor.country_code],
  );

  const hoverLayer = useMemo(() => {
    if (!hoverPathData.length) return null;

    return new PathLayer({
      id: 'hover-outline',
      data: hoverPathData,
      pickable: false,
      getPath: (f: any) => f.path,
      getColor: style.hoveredStyle(1).line,
      getWidth: 2,
      widthUnits: 'pixels',
      widthMinPixels: 2,
      parameters: { depthTest: false }, // keep visible over fill
      updateTriggers: {
        getColor: hoveredFeature?.geoVisitor?.country_code,
      },
    });
  }, [hoverPathData, hoveredFeature?.geoVisitor?.country_code, style]);

  // NOTE: Order matters
  return [fillLayer, strokeBaseLayer, clickedLayer, hoverLayer].filter(Boolean) as any[];
}
