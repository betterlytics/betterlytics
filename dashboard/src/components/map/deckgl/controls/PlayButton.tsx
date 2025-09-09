'use client';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

export const PLAYBACK_TYPES = ['play', 'stop', 'pause'] as const;
export type PlaybackType = (typeof PLAYBACK_TYPES)[number];

const getComponent = (playbackType: PlaybackType) => {
  switch (playbackType) {
    case 'play':
      return Play;
    case 'stop':
      return Square;
    case 'pause':
      return Pause;
    default:
      return null;
  }
};

export const isPlaybackType = (value: any): value is PlaybackType => {
  return PLAYBACK_TYPES.includes(value);
};

export type PlaybackButtonProps = {
  playbackType: PlaybackType;
  onClick: () => void;
};

export function PlaybackButton({ playbackType, onClick }: PlaybackButtonProps) {
  const Icon = useMemo(() => getComponent(playbackType), [playbackType]);
  const t = useTranslations(`components.geography.playback`);

  return (
    <Button size='sm' onClick={onClick} title={t(playbackType)}>
      {Icon && isPlaybackType(playbackType) && <Icon fill={'var(--foreground)'} />}
    </Button>
  );
}
