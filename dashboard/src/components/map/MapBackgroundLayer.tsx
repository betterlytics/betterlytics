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

  const dismissIfOutside = useCallback(
    (e: MouseEvent) => {
      const rect = map.getContainer().getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        clearHovered();
      }
    },
    [map, clearHovered],
  );

  useEffect(() => {
    const mapContainer = map.getContainer();

    map.on('mouseout', clearHovered);
    mapContainer.addEventListener('blur', clearHovered);
    window.addEventListener('mousemove', dismissIfOutside);

    return () => {
      map.off('mouseout', clearHovered);
      mapContainer.removeEventListener('blur', clearHovered);
      window.removeEventListener('mousemove', dismissIfOutside);
    };
  }, [map, clearHovered, dismissIfOutside]);

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
