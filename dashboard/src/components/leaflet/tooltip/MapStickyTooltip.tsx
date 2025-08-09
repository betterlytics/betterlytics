import { useMap } from 'react-leaflet/hooks';
import { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import React from 'react';
import MapTooltipTip from './MapTooltipTip';
import MapTooltipContent from './MapTooltipContent';
import { useMapSelection } from '@/contexts/MapSelectionProvider';
import { cn } from '@/lib/utils';

export type MapStickyTooltip = {
  size?: 'sm' | 'lg';
};

export function getTooltipId(alpha2: string) {
  return `lltooltip-${alpha2}`;
}

export default function MapStickyTooltip({ size = 'sm' }: MapStickyTooltip) {
  const { hoveredFeature, selectedFeature } = useMapSelection();
  const map = useMap();
  const tooltipId = useId();

  const tooltipRef = useRef<HTMLElement | null>(null);
  const latestMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mapContainer = map.getContainer();
    let animationFrame: number | null = null;

    const onMouseMove = (e: MouseEvent) => {
      latestMouseRef.current = { x: e.clientX, y: e.clientY - 2 };
      if (tooltipRef.current) {
        tooltipRef.current.style.transform = `translate3d(${latestMouseRef.current.x}px, ${latestMouseRef.current.y}px, 0) translate(-50%, -100%)`;
      }
    };

    mapContainer.addEventListener('mousemove', onMouseMove);

    const initialPositioning = () => {
      if (tooltipRef.current) {
        tooltipRef.current.style.transform = `translate3d(${latestMouseRef.current.x}px, ${latestMouseRef.current.y}px, 0) translate(-50%, -100%)`;
      }
    };
    requestAnimationFrame(initialPositioning);

    return () => {
      mapContainer.removeEventListener('mousemove', onMouseMove);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [tooltipRef, map]);

  if (!hoveredFeature || selectedFeature) return null;

  return createPortal(
    <section
      id={tooltipId}
      ref={tooltipRef}
      role='tooltip'
      aria-hidden={false}
      className={cn(
        'my-tooltip pointer-events-none fixed top-0 left-0 z-[11] flex flex-col will-change-transform',
      )}
    >
      <MapTooltipContent geoVisitor={hoveredFeature?.geoVisitor} size={size} />
      <MapTooltipTip />
    </section>,
    document.body,
  );
}
