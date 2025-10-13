'use client';

import React, { useState } from 'react';
import { PlaybackButton } from '@/components/map/deckgl/controls/PlaybackButton';
import { TimeSlider, type TimeSliderTick } from '@/components/map/deckgl/controls/TimeSlider';
import { PlaybackSpeedDropdown } from '@/components/map/deckgl/controls/PlaybackSpeedDropdown';
import { cn } from '@/lib/utils';
import { ScaleMotion } from '@/components/ScaleMotion';
import { createPortal } from 'react-dom';

export type MapPlayActionbarProps<TValue> = {
  ticks: TimeSliderTick<TValue>[];
  value: number;
  playing: boolean;
  speed: any;
  onTogglePlay: () => void;
  onScrub: (index: number) => void;
  onChangeSpeed: (speed: any) => void;
  className?: string;
};

export function MapPlayActionbar<TValue>({
  ticks,
  value,
  playing,
  speed,
  className,
  onTogglePlay,
  onScrub,
  onChangeSpeed,
}: MapPlayActionbarProps<TValue>) {
  const [hovering, setHovering] = useState(false);

  return createPortal(
    <ScaleMotion
      initialScale={0.8}
      hoverScale={1}
      opacityRange={[0.8, 1]}
      opacityValues={[0.6, 1]}
      onHoverEndComplete={() => setHovering(false)}
      onHoverStartComplete={() => setHovering(true)}
      startTransition={{ duration: 0.2, ease: 'easeOut' }}
      endTransition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(className, 'bg-background flex flex-col gap-2 rounded-xl px-4 py-2 shadow-md')}
    >
      <div className='flex items-center gap-3'>
        <PlaybackButton onClick={onTogglePlay} playbackType={playing ? 'pause' : 'play'} />
        <TimeSlider ticks={ticks} value={value} playing={playing} onScrub={onScrub} hovering={hovering} />
        <PlaybackSpeedDropdown speed={speed} onChange={onChangeSpeed} />
      </div>
    </ScaleMotion>,
    document.body,
  );
}
