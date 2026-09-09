import { useEffect } from 'react';
import type { LatLngBounds } from 'leaflet';
import { useMap } from 'react-leaflet/hooks';

export default function MapFitBounds({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    // MapContainer only fits bounds at construction; refit so clamps stay correct on bounds swaps
    map.fitBounds(bounds, { padding: [16, 16], animate: false });
    const fitZoom = map.getZoom();
    map.setMinZoom(Math.max(0, fitZoom - 0.5));
    map.setMaxZoom(fitZoom + 4);
    map.setMaxBounds(bounds.pad(0.25));
  }, [map, bounds]);

  return null;
}
