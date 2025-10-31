'use client';

import { useMapSelectionActions, useMapSelectionState } from '@/contexts/DeckGLSelectionContextProvider';
import { cn } from '@/lib/utils';
import { type MapViewState, WebMercatorViewport } from '@deck.gl/core';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import React from 'react';
import MapPopupContent from '@/components/map/tooltip/MapPopupContent';
import MapTooltipTip from '@/components/map/tooltip/MapTooltipTip';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

interface DeckGLPopupProps {
  size?: 'sm' | 'lg';
  children?: React.ReactNode;
  viewState?: MapViewState;
  isTimeseries?: boolean;
}

function DeckGLPopupComponent({ size = 'sm', viewState, isTimeseries, children }: DeckGLPopupProps) {
  const { clickedFeatureRef } = useMapSelectionActions();
  const { clicked } = useMapSelectionState();
  const locale = useLocale();
  const timeRangeCtx = useTimeRangeContext();
  const clickedFeature = clickedFeatureRef?.current;
  if (!clickedFeature || !clicked || !viewState) return null;

  const viewport = new WebMercatorViewport(viewState);
  const featureLatLng: [number, number] = [clickedFeature.longitude ?? 0, clickedFeature.latitude ?? 0];
  const [x, y] = viewport.project(featureLatLng);

  return (
    <motion.section
      role='tooltip'
      aria-hidden={false}
      style={{
        left: x,
        top: y - 60,
        pointerEvents: 'auto',
        position: 'absolute',
      }}
      className={cn(
        'deckgl-controller',
        'rounded-md border-none bg-transparent p-0 shadow-none',
        'pointer-events-none z-11 flex flex-col will-change-transform',
      )}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        mass: 0.8,
      }}
      transformTemplate={
        // ensures origin is still centered above the mouse
        (transform, generated) => `translate(-50%, -100%) ${generated}`
      }
    >
      <div className='bg-card shadow-sidebar-accent-foreground pointer-none inset-0 flex flex-col p-0 shadow-xs'>
        <MapPopupContent
          geoVisitor={clickedFeature?.geoVisitor}
          size={size}
          locale={locale}
          isTimeseries={isTimeseries}
          timeRangeCtx={timeRangeCtx}
        />
        {children}
      </div>
      <MapTooltipTip />
    </motion.section>
  );
}

export const DeckGLPopup = React.memo(DeckGLPopupComponent);
