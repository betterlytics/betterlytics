import { useEffect } from 'react';
import type { LatLngBounds } from 'leaflet';
import { useMap } from 'react-leaflet/hooks';

export default function MapFitBounds({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    const fitZoom = map.getZoom();
    map.setMinZoom(Math.max(0, fitZoom - 0.5));
    map.setMaxZoom(fitZoom + 4);
    map.setMaxBounds(bounds.pad(0.25));
  }, [map, bounds]);

  return null;
}
