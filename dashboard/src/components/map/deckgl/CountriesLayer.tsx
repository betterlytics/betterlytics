import type { FeatureCollection } from 'geojson';
import { useDeckGLMapStyle } from '@/hooks/use-deckgl-mapstyle';
import { useMapSelectionState } from '@/contexts/DeckGLSelectionContextProvider';
import { useMemo } from 'react';
import { GeoJsonLayer, PathLayer } from '@deck.gl/layers';

interface CountriesLayerProps {
  geojson: FeatureCollection | null;
  visitorDict: Record<string, number>;
  playing: boolean;
  frameInterval: number;
  baseInterval: number;
  calculatedMaxVisitors: number;
  frame: number;
}

export function CountriesLayer({
  geojson,
  visitorDict,
  playing,
  frameInterval,
  baseInterval,
  calculatedMaxVisitors,
  frame,
}: CountriesLayerProps) {
  const { hovered: hoveredFeature, clicked: clickedFeature } = useMapSelectionState();
  const style = useDeckGLMapStyle({ calculatedMaxVisitors });

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
      autoHighlight: true,
      highlightColor: style.hoveredStyle(1).line,

      getFillColor: (f: any) => {
        const iso = f.id as string;
        const visitors = visitorDict[iso] ?? 0;
        return style.originalStyle(visitors).fill;
      },
      transitions: {
        getFillColor: { duration: playing ? frameInterval : baseInterval / 5, easing: (t: number) => t * t },
      },
      updateTriggers: {
        getFillColor: frame,
      },
    });
  }, [geojson, frame, visitorDict, style, playing, frameInterval]);

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
        const visitors = visitorDict[iso] ?? 0;
        return style.originalStyle(visitors).line;
      },

      updateTriggers: {
        getLineColor: frame,
      },
    });
  }, [geojson, visitorDict, style, frame]);

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

  // NOTE: Order matters
  return [fillLayer, strokeBaseLayer, clickedLayer].filter(Boolean) as any[];
}
