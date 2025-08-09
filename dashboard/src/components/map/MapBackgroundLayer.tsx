import { useMapSelection } from '@/contexts/MapSelectionContextProvider';
import React, { useEffect } from 'react';
import type { GeoJSON } from 'react-leaflet';
import { useMap } from 'react-leaflet/hooks';

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
  const { setMapSelection } = useMapSelection();
  const map = useMap();

  useEffect(() => {
    const clearHovered = () => setMapSelection({ hovered: undefined });
    map.on('mouseout', clearHovered);
    map.getContainer().addEventListener('blur', clearHovered);

    return () => {
      map.off('mouseout', clearHovered);
      map.getContainer().removeEventListener('blur', clearHovered);
    };
  }, [map, setMapSelection]);

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
          setMapSelection(null);
        },
        mouseover: () => {
          setMapSelection({ hovered: undefined });
        },
      }}
    />
  );
};

const MapBackgroundLayer = React.memo(MapBackgroundLayerComponent);
MapBackgroundLayer.displayName = 'MapBackgroundLayer';
export default MapBackgroundLayer;
