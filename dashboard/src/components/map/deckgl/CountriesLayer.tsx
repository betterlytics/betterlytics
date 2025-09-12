'use client';

import { GeoJsonLayer, GeoJsonLayerProps } from '@deck.gl/layers';
import { FeatureCollection } from 'geojson';
import { useMapSelection } from '@/contexts/DeckGLSelectionContextProvider';
import { useDeckGLMapStyle } from '@/hooks/use-deckgl-mapstyle';

interface CountriesLayerProps {
  geojson: FeatureCollection;
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
}: CountriesLayerProps): GeoJsonLayer {
  const { hoveredFeatureRef, clickedFeatureRef } = useMapSelection();
  const style = useDeckGLMapStyle({ calculatedMaxVisitors });

  return new GeoJsonLayer({
    id: 'deckgl-countries-layer',
    data: geojson,
    filled: true,
    stroked: true,
    pickable: true,
    lineWidthMinPixels: 0.5,
    getFillColor: (f) => {
      const iso = f.id as string;
      const visitors = visitorDict[iso] ?? 0;
      if (clickedFeatureRef?.current?.geoVisitor.country_code === iso) return style.selectedStyle(visitors).fill;
      if (hoveredFeatureRef?.current?.geoVisitor.country_code === iso) return style.hoveredStyle(visitors).fill;
      return style.originalStyle(visitors).fill;
    },
    getLineColor: (f: any) => {
      const iso = f.id as string;
      const visitors = visitorDict[iso] ?? 0;
      if (clickedFeatureRef?.current?.geoVisitor.country_code === iso) return style.selectedStyle(visitors).line;
      if (hoveredFeatureRef?.current?.geoVisitor.country_code === iso) return style.hoveredStyle(visitors).line;
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
  } as GeoJsonLayerProps);
}
