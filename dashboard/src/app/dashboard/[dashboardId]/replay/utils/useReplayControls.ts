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

    const onTime = (event: any) => {
      if (!event.payload) return;
      setCurrentTime(event.payload);
    };
    const onState = (event: any) => {
      const payload = event.payload as 'playing' | 'paused';
      setIsPlaying(payload === 'playing');
    };

    player.addEventListener('ui-update-current-time', onTime as EventListener);
    player.addEventListener('ui-update-player-state', onState as EventListener);

    return () => {
      // Best-effort cleanup - it doesn't seem to implement removeEventListener so I'm unsure how to clean these up?
      try {
        (player as any).removeEventListener?.('ui-update-current-time', onTime as EventListener);
        (player as any).removeEventListener?.('ui-update-player-state', onState as EventListener);
      } catch {}
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
