import type { FeatureCollection } from 'geojson';
import { useDeckGLMapStyle } from '@/hooks/use-deckgl-mapstyle';
import { useMapSelection } from '@/contexts/DeckGLSelectionContextProvider';
import { useMemo } from 'react';
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers';

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
  const { hoveredFeature, clickedFeature } = useMapSelection();
  const style = useDeckGLMapStyle({ calculatedMaxVisitors });

  // Precompute lookup map once
  const featureLookup = useMemo(() => {
    if (!geojson) return new Map<string, GeoJSON.Feature>();
    const map = new Map<string, GeoJSON.Feature>();
    geojson.features.forEach((f) => map.set(f.id as string, f));
    return map;
  }, [geojson]);

  // Highlight layer data (hovered/clicked)
  const filteredData = useMemo(() => {
    const arr: GeoJSON.Feature[] = [];
    if (hoveredFeature?.geoVisitor.country_code) {
      const f = featureLookup.get(hoveredFeature.geoVisitor.country_code);
      if (f) arr.push(f);
    }
    if (clickedFeature?.geoVisitor.country_code) {
      const f = featureLookup.get(clickedFeature.geoVisitor.country_code);
      if (f) arr.push(f);
    }
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
    if (!filteredData.length) return null;
    return new GeoJsonLayer({
      id: 'countries-highlight',
      data: filteredData,
      filled: false,
      stroked: true,
      lineWidthMinPixels: 2,
      getLineColor: (f) =>
        f.id === clickedFeature?.geoVisitor.country_code ? style.selectedStyle().line : style.hoveredStyle().line,
      pickable: false,
      updateTriggers: {
        getLineColor: [hoveredFeature?.geoVisitor?.country_code, clickedFeature?.geoVisitor?.country_code],
      },
    });
  }, [filteredData, hoveredFeature?.geoVisitor.country_code, clickedFeature?.geoVisitor.country_code, style]);

  return [mainLayer, highlightLayer].filter(Boolean) as GeoJsonLayer[];
}
