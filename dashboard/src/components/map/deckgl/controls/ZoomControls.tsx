'use client';

import React from 'react';
import { ZoomButton, ZoomType } from '@/components/map/deckgl/controls/ZoomButton';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { INITIAL_ZOOM_STATE, useSetMapViewState } from '@/contexts/DeckGLViewStateProvider';

export function ZoomControls() {
  const scale = useMotionValue(0.8);
  const setViewState = useSetMapViewState();

  const animateTo = (target: number) =>
    animate(scale, target, {
      type: 'spring',
      stiffness: 400,
      damping: 40,
    });

  const handleZoom = (zoomType: ZoomType) => {
    setViewState((vs) => {
      const currentZoom = vs.zoom ?? INITIAL_ZOOM_STATE.zoom;
      const newZoom = Math.max(0, Math.min(20, currentZoom + (zoomType === 'in' ? 1 : -1)));

      return {
        ...vs, // preserve other view state properties like longitude, etc.
        zoom: newZoom,

        // Not working smoothly since it snaps back cause of extra state update ..
        // transitionDuration: INITIAL_ZOOM_STATE.transitionDuration,
        // transitionInterpolator: INITIAL_ZOOM_STATE.transitionInterpolator,
      };
    });
  };

  return (
    <motion.div
      className='flex flex-col'
      onHoverStart={() => animateTo(1)}
      onHoverEnd={() => animateTo(0.8)}
      onTouchStart={() => animateTo(1)}
      onTouchEnd={() => animateTo(0.8)}
      style={{
        scale,
        opacity: useTransform(scale, [0.8, 1], [0.6, 1]),
      }}
    >
      <ZoomButton
        key='in'
        className='border-b-border border-b-[0.5px]'
        onClick={() => handleZoom('in')}
        zoomType='in'
      />
      <ZoomButton key='out' onClick={() => handleZoom('out')} zoomType='out' />
    </motion.div>
  );
}
