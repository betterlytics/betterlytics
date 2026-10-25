import { useEffect } from 'react';
import type { LatLngBounds } from 'leaflet';
import { useMap } from 'react-leaflet/hooks';

export const FIT_PADDING: [number, number] = [16, 16];
export const FIT_PAN_VISCOSITY = 0.6;
const ZOOM_OUT_ALLOWANCE = 0.5;
const ZOOM_IN_ALLOWANCE = 4;
const PAN_ALLOWANCE = 0.25;

// Pan slack only when zoomed in, so an over-drag at fit zoom snaps back
export default function MapFitBounds({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, { padding: FIT_PADDING, animate: false });
    const fitZoom = map.getZoom();
    map.setMinZoom(Math.max(0, fitZoom - ZOOM_OUT_ALLOWANCE));
    map.setMaxZoom(fitZoom + ZOOM_IN_ALLOWANCE);
    const limitPan = () => map.setMaxBounds(map.getZoom() > fitZoom ? bounds.pad(PAN_ALLOWANCE) : bounds);
    limitPan();
    map.on('zoomend', limitPan);
    return () => {
      map.off('zoomend', limitPan);
    };
  }, [map, bounds]);

  return null;
}
