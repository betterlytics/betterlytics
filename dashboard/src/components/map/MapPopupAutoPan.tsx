import {
  limitCenter,
  measureOverlays,
  measurePopup,
  popupPanOffset,
  roomBand,
  shift,
  type Box,
  type Point,
} from '@/components/map/popup-pan';
import type { LatLngBounds, LatLngBoundsExpression, Popup, PopupEvent } from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet/hooks';

const isLatLngBounds = (bounds: LatLngBoundsExpression | null | undefined): bounds is LatLngBounds =>
  !!bounds && typeof (bounds as LatLngBounds).getNorthEast === 'function';

const toBox = (a: Point, b: Point): Box => ({
  min: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) },
  max: { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y) },
});

const samePoint = (a: Point, b: Point) => Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1;

type MapPopupAutoPanProps = { L: typeof import('leaflet') };

// While a popup is open maxBounds move by the room it needs, so Leaflet keeps limiting drag and zoom itself and glides back on close
export default function MapPopupAutoPan({ L }: MapPopupAutoPanProps) {
  const map = useMap();

  useEffect(() => {
    let restBounds: LatLngBounds | null = null;
    let observer: ResizeObserver | null = null;
    let openPopup: Popup | null = null;
    let disposed = false;

    // After a zoom Leaflet pans into the bounds itself on the moveend that follows, so only the room it would not reach is panned to
    const makeRoom = (popup: Popup, afterZoom = false) => {
      const element = popup.getElement();
      const bounds = restBounds ?? map.options.maxBounds;
      if (!element || popup !== openPopup || !isLatLngBounds(bounds)) return;
      const zoom = map.getZoom();
      const size = map.getSize();
      const band = toBox(map.project(bounds.getNorthEast(), zoom), map.project(bounds.getSouthWest(), zoom));
      const center = map.project(map.getCenter(), zoom);
      const rest = limitCenter(center, size, band);
      const container = map.getContainer();
      const room = popupPanOffset(
        shift(measurePopup(element), { x: rest.x - center.x, y: rest.y - center.y }),
        container.getBoundingClientRect(),
        measureOverlays(container),
      );
      if (!room.x && !room.y && !restBounds) return;
      restBounds = bounds;
      const roomed = roomBand(band, size, rest, room);
      const northWest = map.unproject([roomed.min.x, roomed.min.y], zoom);
      const southEast = map.unproject([roomed.max.x, roomed.max.y], zoom);
      map.options.maxBounds = L.latLngBounds(northWest, southEast);
      const target = { x: rest.x + room.x, y: rest.y + room.y };
      const settled = afterZoom ? limitCenter(center, size, roomed) : center;
      if (!samePoint(settled, target)) {
        map.panTo(map.unproject([target.x, target.y], zoom));
      }
    };

    const onOpen = ({ popup }: PopupEvent) => {
      openPopup = popup;
      observer?.disconnect();
      const element = popup.getElement();
      if (!element) return;
      observer = new ResizeObserver(() => makeRoom(popup));
      observer.observe(element);
    };

    const onZoomEnd = () => {
      if (openPopup) makeRoom(openPopup, true);
    };

    const restoreBounds = () => {
      if (disposed || openPopup || !restBounds) return;
      map.setMaxBounds(restBounds);
      restBounds = null;
    };

    // The next popup opens in the same tick, so the restore yields to it and the room carries over
    const onClose = () => {
      openPopup = null;
      observer?.disconnect();
      observer = null;
      queueMicrotask(restoreBounds);
    };

    const dispose = () => {
      disposed = true;
      observer?.disconnect();
      observer = null;
      restBounds = null;
    };

    map.on('popupopen', onOpen);
    map.on('popupclose', onClose);
    map.on('zoomend', onZoomEnd);
    map.on('unload', dispose);
    return () => {
      map.off('popupopen', onOpen);
      map.off('popupclose', onClose);
      map.off('zoomend', onZoomEnd);
      map.off('unload', dispose);
      dispose();
    };
  }, [map, L]);

  return null;
}
