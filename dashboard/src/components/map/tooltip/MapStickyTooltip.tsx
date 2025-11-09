import { useMapSelectionState } from '@/contexts/MapSelectionContextProvider';
import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet/hooks';
import MapTooltipContent from './MapTooltipContent';
import MapTooltipTip from './MapTooltipTip';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';

export type MapStickyTooltip = {
  size?: 'sm' | 'lg';
};

export default function MapStickyTooltip({ size = 'sm' }: MapStickyTooltip) {
  const { hoveredFeature, clickedFeature: selectedFeature } = useMapSelectionState();
  const map = useMap();
  const tooltipId = useId();
  const locale = useLocale();
  const t = useTranslations('components.geography');

  const tooltipRef = useRef<HTMLElement | null>(null);
  const latestMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mapContainer = map.getContainer();

    const updateMousePosition = (e: MouseEvent) => {
      latestMouseRef.current = { x: e.clientX, y: e.clientY - 2 };
      if (tooltipRef.current) {
        tooltipRef.current.style.transform = `translate3d(${latestMouseRef.current.x}px, ${latestMouseRef.current.y}px, 0) translate(-50%, -100%)`;
      }
    };

    mapContainer.addEventListener('mousemove', updateMousePosition);

    if (tooltipRef.current) {
      const position = hoveredFeature?.mousePosition || latestMouseRef.current;
      if (hoveredFeature?.mousePosition) {
        latestMouseRef.current = hoveredFeature.mousePosition;
      }
      tooltipRef.current.style.transform = `translate3d(${position.x}px, ${position.y - 2}px, 0) translate(-50%, -100%)`;
    }

    return () => {
      mapContainer.removeEventListener('mousemove', updateMousePosition);
    };
  }, [map, selectedFeature, hoveredFeature]);

  const hasValidPosition =
    hoveredFeature?.mousePosition || latestMouseRef.current.x !== 0 || latestMouseRef.current.y !== 0;

  if (
    !hoveredFeature ||
    (selectedFeature && hoveredFeature.geoVisitor.country_code === selectedFeature.geoVisitor.country_code) ||
    !hasValidPosition
  ) {
    return null;
  }

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
        <MapTooltipContent
          geoVisitor={hoveredFeature?.geoVisitor}
          size={size}
          locale={locale}
          label={t('visitors')}
        />
      </div>
      <MapTooltipTip />
    </section>,
    document.body,
  );
}
