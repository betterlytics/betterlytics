'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReplayPlayerHandle } from '@/app/dashboard/[dashboardId]/replay/ReplayPlayer';

export type ReplayControlsState = {
  isPlaying: boolean;
  speed: number;
  currentTime: number;
  durationMs: number;
};

export type ReplayControlsApi = ReplayControlsState & {
  playPause: () => void;
  setSpeed: (s: number) => void;
  seekToRatio: (ratio: number) => void; // 0..1
  setDurationMs: (ms: number) => void;
  setCurrentTime: (ms: number) => void;
};

export function useReplayControls(playerRef: React.RefObject<ReplayPlayerHandle | null>): ReplayControlsApi {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const playPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [playerRef, isPlaying]);

  const setSpeed = useCallback(
    (s: number) => {
      setSpeedState(s);
      playerRef.current?.setSpeed(s);
    },
    [playerRef],
  );

  const seekToRatio = useCallback(
    (ratio: number) => {
      const duration = durationMs;
      const clamped = Math.max(0, Math.min(1, ratio));
      const target = Math.floor(duration * clamped);
      playerRef.current?.seekTo(target);
      setCurrentTime(target);
    },
    [playerRef, durationMs],
  );

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onTime = (e: CustomEvent<{ payload: number }>) => {
      console.log('onTime', e.detail.payload);
      setCurrentTime(e.detail.payload);
    };
    const onState = (e: CustomEvent<{ payload: 'playing' | 'paused' }>) => {
      console.log('onState', e.detail.payload);
      setIsPlaying(e.detail.payload === 'playing');
    };

    player.addEventListener('ui-update-current-time', onTime);
    player.addEventListener('ui-update-player-state', onState);

    return () => {
      player.removeEventListener('ui-update-current-time', onTime);
      player.removeEventListener('ui-update-player-state', onState);
    };
  }, [playerRef]);

  return useMemo(
    () => ({
      isPlaying,
      speed,
      currentTime,
      durationMs,
      playPause,
      setSpeed,
      seekToRatio,
      setDurationMs,
      setCurrentTime,
    }),
    [isPlaying, speed, currentTime, durationMs, playPause, setSpeed, seekToRatio],
  );
}
