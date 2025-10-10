'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MorphedIcon from '@/components/icons/MorphedIcon';

export type PlaybackButtonProps = {
  playbackType: 'play' | 'pause';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
};

const SVG_PATHS = {
  play: {
    base: 'm0,0h53v178H0V0Z',
    morphed: 'm70.45,134.74l-57.68,43.26V0l56.48,42.36,1.19,92.38Z',
  },
  pause: {
    base: 'm91,0h53v178h-53V0Z',
    morphed: 'm65.52,39.56l67.58,49.44-67.58,49.44V39.56Z',
  },
} as const;

export function PlaybackButton({ playbackType, className, style, onClick }: PlaybackButtonProps) {
  const isPlaying = playbackType === 'pause';

  return (
    <Button
      size='sm'
      onClick={onClick}
      title={isPlaying ? 'Pause' : 'Play'}
      className={cn('cursor-pointer', className)}
      style={style}
    >
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 144 178'>
        <MorphedIcon
          paths={[SVG_PATHS.play.base, SVG_PATHS.play.morphed, SVG_PATHS.play.base]}
          active={!isPlaying}
        />
        <MorphedIcon
          paths={[SVG_PATHS.pause.base, SVG_PATHS.pause.morphed, SVG_PATHS.pause.base]}
          active={!isPlaying}
        />
      </svg>
    </Button>
  );
}
