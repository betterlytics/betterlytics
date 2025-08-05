import React from 'react';
import type { FeatureCollection } from 'geojson';
import { useMapEvents, type GeoJSON } from 'react-leaflet';
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
  const { setSelectedFeature, setHoveredFeature } = useMapSelection();

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
          setSelectedFeature(undefined);
          setHoveredFeature(undefined); // is this necessary??
        },
        mouseover: () => {
          setHoveredFeature(undefined); // is this necessary??
        },
      }}
    />
  );
};

const MapBackgroundLayer = React.memo(MapBackgroundLayerComponent);
export default MapBackgroundLayer;
