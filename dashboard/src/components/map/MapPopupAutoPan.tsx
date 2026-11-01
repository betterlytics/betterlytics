import { measureOverlays, measurePopup, popupPanOffset } from '@/components/map/popup-pan';
import type { LatLngBoundsExpression, Popup, PopupEvent } from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet/hooks';

// Leaflet recentres maxBounds on moveend, so the bounds are lifted while a popup is open and restored on close
export default function MapPopupAutoPan() {
  const map = useMap();

  useEffect(() => {
    let savedBounds: LatLngBoundsExpression | null = null;
    let observer: ResizeObserver | null = null;
    let openPopup: Popup | null = null;
    let gliding = false;
    let disposed = false;

    const panIntoView = (popup: Popup) => {
      const element = popup.getElement();
      if (!element || popup !== openPopup) return;
      const container = map.getContainer();
      const offset = popupPanOffset(
        measurePopup(element),
        container.getBoundingClientRect(),
        measureOverlays(container),
      );
      if (!offset.x && !offset.y) return;
      if (map.options.maxBounds && !savedBounds) {
        savedBounds = map.options.maxBounds;
        map.setMaxBounds([]);
      }
      map.panBy([offset.x, offset.y]);
    };

    const onOpen = ({ popup }: PopupEvent) => {
      openPopup = popup;
      observer?.disconnect();
      const element = popup.getElement();
      if (!element) return;
      observer = new ResizeObserver(() => panIntoView(popup));
      observer.observe(element);
      if (gliding) map.once('moveend', () => panIntoView(popup));
    };

    const restoreBounds = () => {
      if (disposed || openPopup || !savedBounds) return;
      gliding = true;
      map.once('moveend', () => {
        gliding = false;
      });
      map.setMaxBounds(savedBounds);
      savedBounds = null;
    };

    // The next popup opens in the same tick, so the restore yields to it and the lifted bounds carry over
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
      savedBounds = null;
    };

    map.on('popupopen', onOpen);
    map.on('popupclose', onClose);
    map.on('unload', dispose);
    return () => {
      map.off('popupopen', onOpen);
      map.off('popupclose', onClose);
      map.off('unload', dispose);
      dispose();
    };
  }, [map]);

  return null;
}
