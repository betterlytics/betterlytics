'use client';

import { PlaybackButton } from '@/components/map/deckgl/controls/PlayButton';
import { TimeSlider } from '@/components/map/deckgl/controls/TimeSlider';
import { PlaybackSpeed, PlaybackSpeedDropdown } from '@/components/map/deckgl/controls/PlaybackSpeedDropdown';
import { ScaleMotion } from '@/components/ScaleMotion';

type MapActionbarProps<TValue> = {
  ticks: { label: string; value: TValue }[];
  value: number; // float playback position
  playing: boolean;
  speed: PlaybackSpeed;
  onTogglePlay: () => void;
  onStop: () => void;
  onScrub: (index: number) => void;
  onChangeSpeed: (speed: PlaybackSpeed) => void;
};

export function MapActionbar<TValue>({
  ticks,
  value,
  playing,
  speed,
  onTogglePlay,
  onStop,
  onScrub,
  onChangeSpeed,
}: MapActionbarProps<TValue>) {
  return (
    <ScaleMotion
      initialScale={0.8}
      hoverScale={1}
      opacityRange={[0.8, 1]}
      opacityValues={[0.5, 0.8]}
      className='bg-background flex flex-col gap-2 rounded-xl p-2 shadow-md'
    >
      <div className='flex items-center gap-3'>
        <PlaybackButton onClick={onTogglePlay} playbackType={playing ? 'pause' : 'play'} />
        <PlaybackButton onClick={onStop} playbackType='stop' />
        <TimeSlider ticks={ticks} value={value} playing={playing} onScrub={onScrub} />
        <PlaybackSpeedDropdown speed={speed} onChange={onChangeSpeed} />
      </div>
    </ScaleMotion>
  );
}
