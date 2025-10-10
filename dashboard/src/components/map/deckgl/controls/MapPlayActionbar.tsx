'use client';

import { PlaybackButton } from '@/components/map/deckgl/controls/PlayButton';
import { TimeSlider, type TimeSliderTick } from '@/components/map/deckgl/controls/TimeSlider';
import { PlaybackSpeed, PlaybackSpeedDropdown } from '@/components/map/deckgl/controls/PlaybackSpeedDropdown';
import { ScaleMotion } from '@/components/ScaleMotion';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export type MapPlayActionbarProps<TValue> = {
  ticks: TimeSliderTick<TValue>[];
  value: number; // float playback position
  playing: boolean;
  speed: PlaybackSpeed;
  onTogglePlay: () => void;
  onScrub: (index: number) => void;
  onChangeSpeed: (speed: PlaybackSpeed) => void;
  className: React.ComponentProps<'div'>['className'];
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

  return (
    <ScaleMotion
      initialScale={0.8}
      hoverScale={1}
      opacityRange={[0.8, 1]}
      opacityValues={[0.6, 1]}
      className={cn(className, 'bg-background flex flex-col gap-2 rounded-xl p-3 shadow-md')}
    >
      <div
        className='flex items-center gap-3'
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <PlaybackButton onClick={onTogglePlay} playbackType={playing ? 'pause' : 'play'} />
        <TimeSlider ticks={ticks} value={value} playing={playing} onScrub={onScrub} hovering={hovering} />
        <PlaybackSpeedDropdown speed={speed} onChange={onChangeSpeed} />
      </div>
    </ScaleMotion>
  );
}
