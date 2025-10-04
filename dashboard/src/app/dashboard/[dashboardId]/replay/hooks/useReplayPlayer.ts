import { useCallback, useEffect, useRef, useState } from 'react';
import { type UsePlayerStateReturn } from './usePlayerState';

export function useReplayPlayer(playerState: UsePlayerStateReturn) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const appliedSkipStateRef = useRef(playerState.isSkippingInactive);

  const playPause = useCallback(() => {
    const player = playerState.playerRef.current;
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [playerState.playerRef, isPlaying]);

  const setSpeed = useCallback(
    (s: number) => {
      setSpeedState(s);
      playerState.playerRef.current?.setSpeed(s);
    },
    [playerState.playerRef],
  );

  const seekToRatio = useCallback(
    (ratio: number) => {
      const player = playerState.playerRef.current;
      if (!player) return;

      const duration = playerState.durationMs;
      const clamped = Math.max(0, Math.min(1, ratio));
      const target = Math.floor(duration * clamped);

      setCurrentTime(target);

      player.seekTo(target);
    },
    [playerState.durationMs, playerState.playerRef, isPlaying],
  );

  useEffect(() => {
    const player = playerState.playerRef.current;
    if (!player) return;

    const onTime = (event: any) => {
      if (event.payload) {
        setCurrentTime(event.payload);
      }
    };

    const onState = (event: any) => {
      const payload = event.payload as 'playing' | 'paused';
      setIsPlaying(payload === 'playing');
    };

    player.addEventListener('ui-update-current-time', onTime as EventListener);
    player.addEventListener('ui-update-player-state', onState as EventListener);

    return () => {
      try {
        (player as any).removeEventListener?.('ui-update-current-time', onTime as EventListener);
        (player as any).removeEventListener?.('ui-update-player-state', onState as EventListener);
      } catch {}
    };
  }, [playerState.playerRef]);

  const setSkipInactive = useCallback(
    (enabled: boolean) => {
      playerState.setSkippingInactive(enabled);
    },
    [playerState.setSkippingInactive],
  );

  useEffect(() => {
    const player = playerState.playerRef.current;
    if (!player) {
      appliedSkipStateRef.current = playerState.isSkippingInactive;
      return;
    }

    if (appliedSkipStateRef.current === playerState.isSkippingInactive) {
      return;
    }

    if (typeof player.toggleSkipInactive === 'function') {
      player.toggleSkipInactive();
      appliedSkipStateRef.current = playerState.isSkippingInactive;
    }
  }, [playerState.isSkippingInactive, playerState.playerRef]);

  return {
    isPlaying,
    speed,
    currentTime,
    setSpeed,
    playPause,
    seekToRatio,
    setSkipInactivity: setSkipInactive,
  };
}
