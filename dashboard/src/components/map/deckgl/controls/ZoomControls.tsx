'use client';

import React from 'react';
import { ZoomButton, ZoomType } from '@/components/map/deckgl/controls/ZoomButton';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';

export type ZoomControlsProps = {
  onZoom: (zoomType: ZoomType) => void;
};

export function ZoomControls({ onZoom }: ZoomControlsProps) {
  const scale = useMotionValue(0.8);

  const animateTo = (target: number) => animate(scale, target, { type: 'spring', stiffness: 200, damping: 20 });

  return (
    <motion.div
      className='flex flex-col'
      onHoverStart={() => animateTo(1)}
      onHoverEnd={() => animateTo(0.8)}
      onTouchStart={() => animateTo(1)}
      onTouchEnd={() => animateTo(0.8)}
      style={{
        scale,
        opacity: useTransform(scale, [0.8, 1], [0.5, 0.8]),
      }}
    >
      <ZoomButton
        key='in'
        className='border-b-border border-b-[0.5px]'
        onClick={() => onZoom('in')}
        zoomType='in'
      />
      <ZoomButton key='out' onClick={() => onZoom('out')} zoomType='out' />
    </motion.div>
  );
}
