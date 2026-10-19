import { useEffect } from 'react';
import { useMap } from 'react-leaflet/hooks';

export default function MapResizeSync() {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}
