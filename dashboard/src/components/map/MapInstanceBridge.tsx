import { useEffect } from 'react';
import { useMap } from 'react-leaflet/hooks';
import type { Map as LeafletMapInstance } from 'leaflet';

export default function MapInstanceBridge({ onReady }: { onReady: (map: LeafletMapInstance | null) => void }) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
    return () => onReady(null);
  }, [map, onReady]);

  return null;
}
