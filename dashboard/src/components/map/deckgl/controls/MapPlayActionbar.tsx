'use client';

import React, { Dispatch, SetStateAction, useRef, useState } from 'react';
import { PlaybackButton } from '@/components/map/deckgl/controls/PlaybackButton';
import { TimeSlider, type TimeSliderTick } from '@/components/map/deckgl/controls/TimeSlider';
import { PlaybackSpeedDropdown } from '@/components/map/deckgl/controls/PlaybackSpeedDropdown';
import { cn } from '@/lib/utils';
import { ScaleMotion } from '@/components/ScaleMotion';
import { createPortal } from 'react-dom';
import { TimeseriesToggleButton } from '../TimeseriesToggleButton';

export type MapPlayActionbarProps<TValue> = {
  ticks: TimeSliderTick<TValue>[];
  value: number;
  playing: boolean;
  speed: any;
  isTimeseries: boolean;
  onToggleTimeseries: () => void;
  onTogglePlay: () => void;
  onScrub: (index: number) => void;
  onChangeSpeed: (speed: any) => void;
  className?: string;
  style?: React.CSSProperties;
};

export function MapPlayActionbar<TValue>({
  ticks,
  value,
  playing,
  speed,
  className,
  style,
  isTimeseries,
  onTogglePlay,
  onToggleTimeseries,
  onScrub,
  onChangeSpeed,
}: MapPlayActionbarProps<TValue>) {
  const [hoverIntent, setHoverIntent] = useState(false);
  const [hoverActive, setHoverActive] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);

  const barRef = useRef<HTMLDivElement | null>(null);
  const PADDING_BOTTOM_PX = 64;
  const PADDING_TOP_PX = 16;

  if (!isTimeseries) return null;

  return createPortal(
    <div className={cn('pointer-events-auto fixed', className)} style={style}>
      <div
        className='relative inline-block h-full w-full'
        onMouseEnter={() => setHoverIntent(true)}
        onMouseLeave={() => setHoverIntent(false)}
      >
        <ScaleMotion
          ref={barRef}
          initialScale={0.8}
          hoverScale={1}
          opacityRange={[0.8, 1]}
          opacityValues={[0.6, 1]}
          startTransition={{ duration: 0.2, ease: 'easeOut' }}
          endTransition={{ duration: 0.2, ease: 'easeOut' }}
          isHovered={hoverIntent}
          onHoverStartComplete={() => setHoverActive(true)}
          onHoverEndComplete={() => {
            setHoverActive(false);
            setSpeedOpen(false);
          }}
          disableEventHover
          className='bg-background mx-6 flex flex-col gap-2 rounded-xl px-4 py-2 shadow-md'
        >
          <div className='flex items-center gap-3'>
            <PlaybackButton onClick={onTogglePlay} playbackType={playing ? 'pause' : 'play'} />
            <TimeSlider ticks={ticks} value={value} playing={playing} onScrub={onScrub} hovering={hoverActive} />
            <PlaybackSpeedDropdown
              speed={speed}
              onChange={onChangeSpeed}
              open={speedOpen}
              onOpenChange={setSpeedOpen}
            />
            <TimeseriesToggleButton isTimeseries={isTimeseries} onToggle={onToggleTimeseries} />
          </div>
        </ScaleMotion>
        {[
          { top: -PADDING_TOP_PX, height: PADDING_TOP_PX },
          { top: '100%', height: PADDING_BOTTOM_PX },
        ].map((style, index) => (
          <div
            key={index}
            aria-hidden
            className='absolute'
            style={{
              left: 0,
              right: 0,
              ...style,
              background: 'transparent',
              pointerEvents: 'auto',
              width: '100%',
            }}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
}
