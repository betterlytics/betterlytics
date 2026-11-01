import { measureOverlayPadding, popupPanOffset } from '@/components/map/popup-pan';
import type { LatLngBoundsExpression, Popup, PopupEvent } from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet/hooks';

// Leaflet recentres maxBounds on moveend, which undoes its own autopan; lifting the bounds while a popup is open lets the pan hold, and restoring them glides the map back
export default function MapPopupAutoPan() {
  const map = useMap();

  useEffect(() => {
    let savedBounds: LatLngBoundsExpression | null = null;
    let observer: ResizeObserver | null = null;

    const panIntoView = (popup: Popup) => {
      const element = popup.getElement();
      if (!element) return;
      const container = map.getContainer();
      const padding = measureOverlayPadding(container);
      const offset = popupPanOffset(element.getBoundingClientRect(), container.getBoundingClientRect(), padding);
      if (!offset.x && !offset.y) return;
      if (map.options.maxBounds && !savedBounds) {
        savedBounds = map.options.maxBounds;
        map.setMaxBounds([]);
      }
      map.panBy([offset.x, offset.y]);
    };

    const onOpen = ({ popup }: PopupEvent) => {
      observer?.disconnect();
      const element = popup.getElement();
      if (!element) return;
      observer = new ResizeObserver(() => panIntoView(popup));
      observer.observe(element);
    };

    const onClose = () => {
      observer?.disconnect();
      observer = null;
      if (savedBounds) {
        map.setMaxBounds(savedBounds);
        savedBounds = null;
      }
    };

    map.on('popupopen', onOpen);
    map.on('popupclose', onClose);
    return () => {
      map.off('popupopen', onOpen);
      map.off('popupclose', onClose);
      observer?.disconnect();
    };
  }, [map]);

  return null;
}
