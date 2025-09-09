'use client';

import { PlayButton } from './PlayButton';
import { StopButton } from './StopButton';
import { TimeSlider } from './TimeSlider';
import { PlaybackSpeed, PlaybackSpeedDropdown } from './PlaybackSpeedDropdown';

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
    <div className='flex flex-col gap-2 rounded-xl bg-white/90 p-2 shadow-md'>
      <div className='flex items-center gap-3'>
        <PlayButton playing={playing} onToggle={onTogglePlay} />
        <StopButton onStop={onStop} />
        <TimeSlider ticks={ticks} value={value} playing={playing} onScrub={onScrub} />
        <PlaybackSpeedDropdown speed={speed} onChange={onChangeSpeed} />
      </div>
    </div>
  );
}
