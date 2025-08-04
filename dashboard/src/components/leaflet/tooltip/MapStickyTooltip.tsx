import { useMap } from 'react-leaflet/hooks';
import { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import React from 'react';
import { GeoVisitor } from '@/entities/geography';
import MapTooltipTip from './MapTooltipTip';
import MapTooltipContent from './MapTooltipContent';

export type MapStickyTooltip = {
  geoVisitor?: GeoVisitor;
  size?: 'sm' | 'lg';
};

export function getTooltipId(alpha2: string) {
  return `lltooltip-${alpha2}`;
}

export default function MapStickyTooltip({ geoVisitor, size = 'sm' }: MapStickyTooltip) {
  const map = useMap();
  const tooltipId = useId();

  const tooltipRef = useRef<HTMLElement | null>(null);
  const latestMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mapContainer = map.getContainer();
    let animationFrame: number | null = null;

    const onMouseMove = (e: MouseEvent) => {
      latestMouseRef.current = { x: e.clientX, y: e.clientY - 2 };

      if (geoVisitor && tooltipRef.current) {
        if (animationFrame === null) {
          animationFrame = requestAnimationFrame(() => {
            if (tooltipRef.current) {
              tooltipRef.current.style.transform = `translate3d(${latestMouseRef.current.x}px, ${latestMouseRef.current.y}px, 0) translate(-50%, -100%)`;
            }
            animationFrame = null;
          });
        }
      }
    };

    mapContainer.addEventListener('mousemove', onMouseMove);

    const initialPositioning = () => {
      if (geoVisitor && tooltipRef.current) {
        tooltipRef.current.style.transform = `translate3d(${latestMouseRef.current.x}px, ${latestMouseRef.current.y}px, 0) translate(-50%, -100%)`;
      }
    };
    requestAnimationFrame(initialPositioning);

    return () => {
      mapContainer.removeEventListener('mousemove', onMouseMove);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [map, geoVisitor]);

  if (!geoVisitor) return null;

  return createPortal(
    <section
      id={tooltipId}
      ref={tooltipRef}
      role='tooltip'
      aria-hidden={false}
      className='my-tooltip pointer-events-none fixed top-0 left-0 z-[11] flex flex-col will-change-transform'
    >
      <MapTooltipContent geoVisitor={geoVisitor} size={size} />
      <MapTooltipTip />
    </section>,
    document.body,
  );
}
