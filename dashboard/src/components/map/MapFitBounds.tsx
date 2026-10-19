import { useEffect } from 'react';
import type { LatLngBounds } from 'leaflet';
import { useMap } from 'react-leaflet/hooks';

export const FIT_PADDING: [number, number] = [16, 16];
const ZOOM_OUT_ALLOWANCE = 0.5;
const ZOOM_IN_ALLOWANCE = 4;
const PAN_ALLOWANCE = 0.25;

// Zoom and pan limits follow the fitted zoom
export default function MapFitBounds({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, { padding: FIT_PADDING, animate: false });
    const fitZoom = map.getZoom();
    map.setMinZoom(Math.max(0, fitZoom - ZOOM_OUT_ALLOWANCE));
    map.setMaxZoom(fitZoom + ZOOM_IN_ALLOWANCE);
    map.setMaxBounds(bounds.pad(PAN_ALLOWANCE));
  }, [map, bounds]);

  return null;
}
