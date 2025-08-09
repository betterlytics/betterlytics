import React, { useEffect } from 'react';
import type { FeatureCollection } from 'geojson';
import { useMap } from 'react-leaflet/hooks';
import type { GeoJSON } from 'react-leaflet';
import type { LeafletEventHandlerFnMap } from 'leaflet';
import { useMapSelection } from '@/contexts/MapSelectionProvider';

interface MapBackgroundLayerProps {
  GeoJSON: typeof GeoJSON;
}

const nomap = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-230, -120],
        [230, -120],
        [230, 120],
        [-230, 120],
        [-230, -120],
      ],
    ],
  },
} as const;

const MapBackgroundLayerComponent = ({ GeoJSON }: MapBackgroundLayerProps) => {
  const { setFeatures } = useMapSelection();
  const map = useMap();

  useEffect(() => {
    const listener = () => setFeatures({ selected: undefined, hovered: undefined });
    map.on('mouseout', listener);
    map.getContainer().addEventListener('blur', listener);

    return () => {
      map.off('mouseout', listener);
      map.getContainer().removeEventListener('blur', listener);
    };
  }, [map, setFeatures]);

  return (
    <GeoJSON
      data={nomap}
      style={{
        fillColor: 'transparent',
        color: 'transparent',
        weight: 0,
      }}
      eventHandlers={{
        click: () => {
          setFeatures(null);
        },
        mouseover: () => {
          setFeatures({ hovered: undefined });
        },
      }}
    />
  );
};

const MapBackgroundLayer = React.memo(MapBackgroundLayerComponent);
export default MapBackgroundLayer;
