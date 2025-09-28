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
  const rafRef = useRef<number | null>(null);

  const cancelRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const tick = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const t = player.getCurrentTime();
    if (typeof t === 'number') {
      setCurrentTime(t);
    }
    if (player.isPlaying()) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelRaf();
      setIsPlaying(false);
    }
  }, [playerRef]);

  const playPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isPlaying()) {
      player.pause();
      setIsPlaying(false);
      cancelRaf();
    } else {
      player.play();
      setIsPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [playerRef, tick]);

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

  useEffect(() => () => cancelRaf(), []);

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
