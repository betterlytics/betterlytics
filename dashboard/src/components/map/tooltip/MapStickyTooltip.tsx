import { useMapSelection } from '@/contexts/MapSelectionContextProvider';
import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet/hooks';
import MapTooltipContent from './MapTooltipContent';
import MapTooltipTip from './MapTooltipTip';
import { cn } from '@/lib/utils';

export type MapStickyTooltip = {
  size?: 'sm' | 'lg';
};

export default function MapStickyTooltip({ size = 'sm' }: MapStickyTooltip) {
  const { hoveredFeature, clickedFeature: selectedFeature } = useMapSelection();
  const map = useMap();
  const tooltipId = useId();

  const tooltipRef = useRef<HTMLElement | null>(null);
  const latestMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mapContainer = map.getContainer();

    const onMouseMove = (e: MouseEvent) => {
      latestMouseRef.current = { x: e.clientX, y: e.clientY - 2 };
      if (tooltipRef.current) {
        tooltipRef.current.style.transform = `translate3d(${latestMouseRef.current.x}px, ${latestMouseRef.current.y}px, 0) translate(-50%, -100%)`;
      }
    };

    mapContainer.addEventListener('mousemove', onMouseMove);

    if (tooltipRef.current && latestMouseRef.current) {
      tooltipRef.current.style.transform = `translate3d(${latestMouseRef.current.x}px, ${latestMouseRef.current.y}px, 0) translate(-50%, -100%)`;
    }

    return () => {
      mapContainer.removeEventListener('mousemove', onMouseMove);
    };
  }, [map, selectedFeature]);

  if (!hoveredFeature || selectedFeature) return null;

  return createPortal(
    <section
      id={tooltipId}
      ref={tooltipRef}
      role='tooltip'
      aria-hidden={false}
      className={cn(
        'map-sticky-tooltip leaflet-popup-content-wrapper',
        'pointer-events-none fixed top-0 left-0 z-[11] flex flex-col will-change-transform',
      )}
    >
      <div className='leaflet-popup-content'>
        <MapTooltipContent geoVisitor={hoveredFeature?.geoVisitor} size={size} />
      </div>
      <MapTooltipTip />
    </section>,
    document.body,
  );
}
