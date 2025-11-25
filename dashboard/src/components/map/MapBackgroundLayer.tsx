import { useMapSelectionSetter } from '@/contexts/MapSelectionContextProvider';
import type { LatLngExpression } from 'leaflet';
import React, { useCallback, useEffect } from 'react';
import type { Polygon } from 'react-leaflet';
import { useMap } from 'react-leaflet/hooks';

const BG_COORDINATES = [
  [-500, -300],
  [500, -300],
  [500, 300],
  [-500, 300],
  [-500, -300],
] as LatLngExpression[];

interface MapBackgroundLayerProps {
  Polygon: typeof Polygon;
}

export default function MapBackgroundLayer({ Polygon }: MapBackgroundLayerProps) {
  const { setMapSelection } = useMapSelectionSetter();
  const map = useMap();

  const clearHovered = useCallback(() => {
    setMapSelection({ hovered: undefined });
  }, [setMapSelection]);

  const handleClick = useCallback(() => {
    setMapSelection(null);
  }, [setMapSelection]);

  const handleMouseOver = useCallback(() => {
    setMapSelection({ hovered: undefined });
  }, [setMapSelection]);

  useEffect(() => {
    map.on('mouseout', clearHovered);
    map.getContainer().addEventListener('blur', clearHovered);

    return () => {
      map.off('mouseout', clearHovered);
      map.getContainer().removeEventListener('blur', clearHovered);
    };
  }, [map, clearHovered]);

  return (
    <Polygon
      positions={BG_COORDINATES}
      pathOptions={{
        fillColor: 'transparent',
        color: 'transparent',
        weight: 0,
      }}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseOver,
      }}
    />
  );
}
