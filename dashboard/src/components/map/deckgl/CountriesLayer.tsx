import type { FeatureCollection } from 'geojson';
import { useDeckGLMapStyle } from '@/hooks/use-deckgl-mapstyle';
import { useMapSelectionState } from '@/contexts/DeckGLSelectionContextProvider';
import { useMemo } from 'react';
import { GeoJsonLayer, PathLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';

interface CountriesLayerProps {
  geojson: FeatureCollection | null;
  visitorDict: Record<string, number>;
  playing: boolean;
  frameInterval: number;
  baseInterval: number;
  calculatedMaxVisitors: number;
}

export function CountriesLayer({
  geojson,
  visitorDict,
  playing,
  frameInterval,
  baseInterval,
  calculatedMaxVisitors,
}: CountriesLayerProps) {
  const { hovered: hoveredFeature, clicked: clickedFeature } = useMapSelectionState();
  const style = useDeckGLMapStyle({ calculatedMaxVisitors });

  const featureLookup = useMemo(() => {
    if (!geojson) return new Map<string, GeoJSON.Feature>();
    const map = new Map<string, GeoJSON.Feature>();
    geojson.features.forEach((f) => map.set(f.id as string, f));
    return map;
  }, [geojson]);

  const pathData = useMemo(() => {
    const arr: Array<GeoJSON.Feature & { path: number[][] }> = [];

    const addFeaturePaths = (countryCode?: string) => {
      if (!countryCode) return;
      const f = featureLookup.get(countryCode);
      if (!f) return;

      if (f.geometry.type === 'Polygon') {
        arr.push({ ...f, path: f.geometry.coordinates[0] });
      } else if (f.geometry.type === 'MultiPolygon') {
        f.geometry.coordinates.forEach((poly) => arr.push({ ...f, path: poly[0] }));
      }
    };

    addFeaturePaths(hoveredFeature?.geoVisitor.country_code);
    addFeaturePaths(clickedFeature?.geoVisitor.country_code);

    return arr;
  }, [featureLookup, hoveredFeature?.geoVisitor.country_code, clickedFeature?.geoVisitor.country_code]);

  const mainLayer = useMemo(() => {
    if (!geojson) return null;
    return new GeoJsonLayer({
      id: 'deckgl-countries-layer',
      data: geojson,
      filled: true,
      stroked: true,
      pickable: true,
      lineWidthMinPixels: 1,
      getFillColor: (f: any) => {
        const iso = f.id as string;
        const visitors = visitorDict[iso] ?? 0;
        return style.originalStyle(visitors).fill;
      },
      getLineColor: (f: any) => {
        const iso = f.id as string;
        const visitors = visitorDict[iso] ?? 0;
        return style.originalStyle(visitors).line;
      },
      transitions: {
        getFillColor: {
          duration: playing ? frameInterval : baseInterval / 5,
          easing: (t: number) => t * t,
        },
      },
      updateTriggers: {
        getFillColor: visitorDict,
        getLineColor: visitorDict,
      },
    });
  }, [geojson, visitorDict, style, playing, frameInterval, baseInterval]);

  const highlightLayer = useMemo(() => {
    if (!pathData.length) return null;

    return new PathLayer({
      id: 'highlight-paths',
      data: pathData,
      pickable: false,
      getPath: (f: any) => f.path, // outer ring
      getColor: (f: any) =>
        f.id === clickedFeature?.geoVisitor.country_code ? style.selectedStyle().line : style.hoveredStyle().line,
      getWidth: 2,
      widthUnits: 'pixels',
      extensions: [new PathStyleExtension({})],
      updateTriggers: {
        getColor: [hoveredFeature?.geoVisitor?.country_code, clickedFeature?.geoVisitor?.country_code],
      },
    });
  }, [pathData, hoveredFeature?.geoVisitor?.country_code, clickedFeature?.geoVisitor?.country_code, style]);

  return [mainLayer, highlightLayer].filter(Boolean) as GeoJsonLayer[];
}
