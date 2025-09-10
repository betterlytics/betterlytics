import { FeatureCollection } from 'geojson';
import { useDeckGLMapStyle } from '../use-deckgl-mapstyle';
import { useMapSelection } from '@/contexts/DeckGLSelectionContextProvider';
import { useMemo } from 'react';
import { GeoJsonLayer } from '@deck.gl/layers';

interface CountriesLayerProps {
  geojson: FeatureCollection | null;
  visitorDict: Record<string, number>;
  playing: boolean;
  frameInterval: number;
  baseInterval: number;
  calculatedMaxVisitors: number;
}

export function useCountriesLayer({
  geojson,
  visitorDict,
  playing,
  frameInterval,
  baseInterval,
  calculatedMaxVisitors,
}: CountriesLayerProps) {
  const { hoveredFeature, clickedFeature, setMapSelection } = useMapSelection();
  const style = useDeckGLMapStyle({ calculatedMaxVisitors });

  return useMemo(() => {
    if (!geojson) return [];
    console.log(
      'new countries layer',
      hoveredFeature?.geoVisitor.country_code,
      clickedFeature?.geoVisitor.country_code,
    );
    return [
      new GeoJsonLayer({
        id: 'deckgl-countries-layer',
        data: geojson,
        filled: true,
        stroked: true,
        pickable: true,
        lineWidthMinPixels: 0.5,
        getFillColor: (f: any) => {
          const iso = f.id as string;
          const visitors = visitorDict[iso] ?? 0;
          if (clickedFeature?.geoVisitor.country_code === iso) return style.selectedStyle(visitors).fill;
          if (hoveredFeature?.geoVisitor.country_code === iso) return style.hoveredStyle(visitors).fill;
          return style.originalStyle(visitors).fill;
        },
        getLineColor: (f: any) => {
          const iso = f.id as string;
          const visitors = visitorDict[iso] ?? 0;
          if (clickedFeature?.geoVisitor.country_code === iso) return style.selectedStyle(visitors).line;
          if (hoveredFeature?.geoVisitor.country_code === iso) return style.hoveredStyle(visitors).line;
          return style.originalStyle(visitors).line;
        },
        onHover: (info) => {
          if (info.object) {
            setMapSelection({
              hovered: {
                geoVisitor: {
                  country_code: info.object.id as string,
                  visitors: visitorDict[info.object.id] ?? 0,
                },
              },
            });
          } else {
            setMapSelection({ hovered: undefined });
          }
        },
        onClick: (info) => {
          if (info.object) {
            setMapSelection({
              clicked: {
                longitude: info?.coordinate?.[0],
                latitude: info?.coordinate?.[1],
                geoVisitor: {
                  country_code: info.object.id as string,
                  visitors: visitorDict[info.object.id] ?? 0,
                },
              },
            });
          } else {
            setMapSelection({ clicked: undefined });
          }
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
      }),
    ];
  }, [geojson, visitorDict, hoveredFeature, clickedFeature, playing, frameInterval, baseInterval, style]);
}
