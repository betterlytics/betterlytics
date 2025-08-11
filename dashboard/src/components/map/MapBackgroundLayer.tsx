import { BACKGROUND_WORLD } from '@/constants/geographyData';
import { useMapSelection } from '@/contexts/MapSelectionContextProvider';
import React, { useCallback, useEffect } from 'react';
import type { GeoJSON } from 'react-leaflet';
import { useMap } from 'react-leaflet/hooks';

interface MapBackgroundLayerProps {
  GeoJSON: typeof GeoJSON;
}

export default function MapBackgroundLayer({ GeoJSON }: MapBackgroundLayerProps) {
  const { setMapSelection } = useMapSelection();
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
    <GeoJSON
      data={BACKGROUND_WORLD}
      style={{
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
