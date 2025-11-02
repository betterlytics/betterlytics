'use client';

import React from 'react';
import { ZoomButton } from '@/components/map/deckgl/controls/ZoomButton';
import type { ZoomType } from '@/types/deckgl-viewtypes';
import { cn } from '@/lib/utils';
import { ScaleMotion } from '@/components/ScaleMotion';
import { useMapCommands } from '@/contexts/DeckGLMapContext';

export type ZoomControlsProps = {
  className: React.ComponentProps<'div'>['className'];
  style?: React.CSSProperties;
};

function ZoomControlsComponent({ className, style }: ZoomControlsProps) {
  const { runCommand } = useMapCommands();

  const handleZoom = (zoomType: ZoomType) => {
    runCommand('zoom', zoomType);
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

const ZoomControls = React.memo(ZoomControlsComponent);
ZoomControls.displayName = 'ZoomControls';
export default ZoomControls;
