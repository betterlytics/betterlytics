'use client';

import React from 'react';
import { ZoomButton, ZoomType } from '@/components/map/deckgl/controls/ZoomButton';
import { INITIAL_ZOOM_STATE, useSetMapViewState } from '@/contexts/DeckGLViewStateProvider';
import { cn } from '@/lib/utils';
import { ScaleMotion } from '@/components/ScaleMotion';

export type ZoomControlsProps = {
  className: React.ComponentProps<'div'>['className'];
  style?: React.CSSProperties;
};

export function ZoomControls({ className, style }: ZoomControlsProps) {
  const setViewState = useSetMapViewState();

  const handleZoom = (zoomType: ZoomType) => {
    setViewState((vs) => {
      const currentZoom = vs.zoom ?? INITIAL_ZOOM_STATE.zoom;
      const newZoom = Math.max(0, Math.min(20, currentZoom + (zoomType === 'in' ? 1 : -1)));
      return { zoom: newZoom };
    });
  };

  return (
    <ScaleMotion
      className={cn(className, 'flex flex-col')}
      initialScale={0.8}
      hoverScale={1}
      opacityRange={[0.8, 1]}
      opacityValues={[0.6, 1]}
      startTransition={{ type: 'spring', stiffness: 400, damping: 40 }}
      endTransition={{ type: 'spring', stiffness: 400, damping: 40 }}
      style={style}
    >
      <ZoomButton
        key='in'
        className='border-b-border border-b-[0.5px]'
        onClick={() => handleZoom('in')}
        zoomType='in'
      />
      <ZoomButton key='out' onClick={() => handleZoom('out')} zoomType='out' />
    </ScaleMotion>
  );
}
