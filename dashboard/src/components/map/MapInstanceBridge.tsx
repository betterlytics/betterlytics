import { useEffect } from 'react';
import { useMap } from 'react-leaflet/hooks';
import type { Map as LeafletMapInstance } from 'leaflet';

export default function MapInstanceBridge({ setMap }: { setMap: (map: LeafletMapInstance | null) => void }) {
  const map = useMap();

  useEffect(() => {
    setMap(map);
    return () => setMap(null);
  }, [map, setMap]);

  return null;
}
