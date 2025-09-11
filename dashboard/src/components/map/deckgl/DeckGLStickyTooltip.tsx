'use client';

import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMapSelection } from '@/contexts/DeckGLSelectionContextProvider';
import MapTooltipContent from '../tooltip/MapTooltipContent';
import MapTooltipTip from '../tooltip/MapTooltipTip';
import { cn } from '@/lib/utils';

export type DeckGLStickyTooltipProps = {
  size?: 'sm' | 'lg';
  containerRef: React.RefObject<HTMLDivElement | null>;
};

export default function DeckGLStickyTooltip({ size = 'sm', containerRef }: DeckGLStickyTooltipProps) {
  const { hoveredFeature, clickedFeature } = useMapSelection();
  const tooltipId = useId();
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const latestMouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.transform = `translate3d(${latestMouseRef.current.x}px, ${latestMouseRef.current.y}px, 0) translate(-50%, -100%)`;
    }
  }, [clickedFeature]);

  useEffect(() => {
    if (!containerRef.current) return;
    const mapContainer = containerRef.current;

    const onMouseMove = (e: MouseEvent) => {
      latestMouseRef.current = { x: e.clientX, y: e.clientY - 2 };

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (tooltipRef.current) {
            tooltipRef.current.style.transform = `translate3d(${latestMouseRef.current.x}px, ${latestMouseRef.current.y}px, 0) translate(-50%, -100%)`;
          }
          rafRef.current = 0;
        });
      }
    };

    mapContainer.addEventListener('mousemove', onMouseMove);

    return () => {
      mapContainer.removeEventListener('mousemove', onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  if (!hoveredFeature || clickedFeature) return null;

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
      <div className='leaflet-popup-content rounded-lg'>
        <MapTooltipContent geoVisitor={hoveredFeature.geoVisitor} size={size} />
      </div>
      <MapTooltipTip />
    </section>,
    document.body,
  );
}
