import { useMapSelectionState } from '@/contexts/DeckGLSelectionContextProvider';
import { DeckGLMapStyle } from '@/hooks/use-deckgl-mapstyle';
import { GeoJsonLayer, PathLayer } from '@deck.gl/layers';
import type { FeatureCollection } from 'geojson';
import { useMemo } from 'react';

export type GeoJsonAnimation = {
  duration: number;
  easing: (t: number) => number;
};

export type UseCountriesLayerProps = {
  geojson: FeatureCollection | null;
  visitorData: Record<string, number>;
  fillAnimation?: GeoJsonAnimation;
  outlineAnimation?: GeoJsonAnimation;
  style: DeckGLMapStyle;
  isMapHovered: boolean; // To detect hover on controls
  colorUpdateTrigger: unknown;
};
export function useCountriesLayer({
  geojson,
  visitorData,
  style,
  colorUpdateTrigger,
  fillAnimation,
  outlineAnimation,
  isMapHovered,
}: UseCountriesLayerProps) {
  const { clicked: clickedFeature } = useMapSelectionState();

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

  const countriesLayer = useMemo(() => {
    if (!geojson) return null;

    return new GeoJsonLayer({
      id: 'countries',
      data: geojson,
      pickable: true,
      filled: true,
      stroked: true,
      autoHighlight: true,
      highlightedObjectIndex: isMapHovered ? null : -1,
      highlightColor: style.hoveredStyle().line,
      lineWidthMinPixels: 1,
      wrapLongitude: true,

      getFillColor: (f: any) => {
        const iso = f.id as string;
        const visitors = visitorData[iso] ?? 0;
        return style.originalStyle(visitors).fill;
      },
      getLineColor: (f: any) => {
        const iso = f.id as string;
        const visitors = visitorData[iso] ?? 0;
        return style.originalStyle(visitors).line;
      },
      transitions: {
        getFillColor: fillAnimation,
        getLineColor: outlineAnimation,
      },
      updateTriggers: {
        getFillColor: colorUpdateTrigger,
        getLineColor: colorUpdateTrigger,
      },
    });
  }, [geojson, visitorData, style, colorUpdateTrigger, fillAnimation, outlineAnimation, isMapHovered]);

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
      getColor: style.selectedStyle().line,
      getWidth: 2,
      widthUnits: 'pixels',
      widthMinPixels: 2,
      parameters: { depthTest: false },
      updateTriggers: {
        getColor: clickedFeature?.geoVisitor?.country_code,
      },
    });
  }, [clickedPathData, clickedFeature?.geoVisitor?.country_code, style]);

  return [countriesLayer, clickedLayer].filter(Boolean);
}
