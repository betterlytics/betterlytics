'use client';

import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as ReactDOM from 'react-dom/client';
import { useMapSelectionActions } from '@/contexts/DeckGLSelectionContextProvider';
import MapTooltipContent from '../tooltip/MapTooltipContent';
import MapTooltipTip from '../tooltip/MapTooltipTip';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';

export type DeckGLStickyTooltipProps = {
  size?: 'sm' | 'lg';
  containerRef: React.RefObject<HTMLDivElement | null>;
};

function DeckGLStickyTooltipComponent({ size = 'sm', containerRef }: DeckGLStickyTooltipProps) {
  const { hoveredFeatureRef, clickedFeatureRef } = useMapSelectionActions();

  const tooltipId = useId();
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReactDOM.Root | null>(null);
  const rafRef = useRef<number>(0);
  const latestMouseRef = useRef({ x: 0, y: 0 });

  const locale = useLocale();
  const t = useTranslations('components.geography');

  useEffect(() => {
    if (!containerRef.current) return;
    const mapContainer = containerRef.current;

    const onPointerMove = (e: MouseEvent) => {
      latestMouseRef.current = { x: e.clientX, y: e.clientY - 8 };
    };

    mapContainer.addEventListener('pointermove', onPointerMove);
    return () => {
      mapContainer.removeEventListener('pointermove', onPointerMove);
    };
  }, [containerRef]);

  useEffect(() => {
    const node = tooltipRef.current;
    if (!node) return;

    const contentDiv = node.querySelector('.tooltip-content') as HTMLElement;
    if (!contentDiv) return;

    if (!rootRef.current) {
      rootRef.current = ReactDOM.createRoot(contentDiv);
    }

    let lastHovered: typeof hoveredFeatureRef.current | null = null;

    // Round to nearest half pixel to avoid blurriness on fractional pixels
    const roundHalf = (v: number) => Math.round(v * 2) / 2;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);

      const hovered = hoveredFeatureRef.current;
      const clicked = clickedFeatureRef.current;
      const { x, y } = latestMouseRef.current;

      node.style.transform = `translate3d(${roundHalf(x)}px, ${roundHalf(y)}px, 0) translate(-50%, -100%)`;

      if (!hovered || clicked?.geoVisitor.country_code === hovered.geoVisitor.country_code) {
        node.style.display = 'none';
        lastHovered = null;
        return;
      }

      node.style.display = 'flex';

      if (hovered !== lastHovered && rootRef.current) {
        lastHovered = hovered;
        rootRef.current.render(
          <MapTooltipContent geoVisitor={hovered.geoVisitor} size={size} locale={locale} label={t('visitors')} />,
        );
      }
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [t, locale]);

  return createPortal(
    <section
      id={tooltipId}
      ref={tooltipRef}
      role='tooltip'
      aria-hidden={false}
      className={cn(
        'map-sticky-tooltip border-none bg-transparent p-0 shadow-none contain-paint',
        'pointer-events-none fixed top-0 left-0 z-[11] flex flex-col will-change-transform',
      )}
    >
      <div className='tooltip-content bg-card shadow-sidebar-accent-foreground pointer-none mx-0 mt-2 flex flex-col rounded-lg p-0 shadow-xs' />
      <MapTooltipTip />
    </section>,
    document.body,
  );
}

const DeckGLStickyTooltip = React.memo(DeckGLStickyTooltipComponent);
export default DeckGLStickyTooltip;
