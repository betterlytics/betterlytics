'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import type { eventWithTime } from '@rrweb/types';

export type ReplayPlayerHandle = {
  loadInitialEvents: (events: eventWithTime[]) => void;
  appendEvents: (events: eventWithTime[]) => void;
  seekTo: (timeOffset: number) => void;
  getCurrentTime: () => number | undefined;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  isPlaying: () => boolean;
  reset: () => void;
};

type ReplayPlayerProps = {
  onReady?: () => void;
};

const getReplayer = (playerRef: React.RefObject<rrwebPlayer | null>) => {
  return playerRef.current?.getReplayer();
};

const ReplayPlayerComponent = ({ onReady }: ReplayPlayerProps, ref: React.ForwardedRef<ReplayPlayerHandle>) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<rrwebPlayer | null>(null);

  const destroyPlayer = () => {
    if (playerRef.current) {
      const maybeDestroy = playerRef.current as unknown as { destroy?: () => void };
      maybeDestroy.destroy?.();
      playerRef.current = null;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  };

  useImperativeHandle(ref, () => ({
    loadInitialEvents(events) {
      if (!containerRef.current) {
        throw new Error('Replay container not mounted');
      }

      destroyPlayer();

      if (events.length === 0) {
        return;
      }

      playerRef.current = new rrwebPlayer({
        target: containerRef.current,
        props: {
          events,
          autoPlay: false,
          showController: false,
          speedOption: [1, 2, 4, 8],
        },
      });

      onReady?.();
    },
    appendEvents(events) {
      if (!playerRef.current || events.length === 0) {
        return;
      }
      // Use try/catch to avoid noisy console errors if player was disposed mid-loop
      try {
        events.forEach((event) => playerRef.current?.addEvent(event));
      } catch (_err) {
        // Swallow errors when the underlying replayer has been destroyed
      }
    },
    seekTo(timeOffset) {
      if (!playerRef.current) {
        return;
      }
      playerRef.current.goto(timeOffset, false);
    },
    getCurrentTime() {
      if (!playerRef.current) {
        return undefined;
      }
      const replayer = playerRef.current.getReplayer();
      return typeof replayer.getCurrentTime === 'function' ? replayer.getCurrentTime() : undefined;
    },
    play() {
      playerRef.current?.play();
    },
    pause() {
      playerRef.current?.pause();
    },
    setSpeed(speed: number) {
      const player = playerRef.current;
      if (!player) return;

      // Try direct setSpeed first
      const maybeSetSpeed = (player as unknown as { setSpeed?: (s: number) => void }).setSpeed;
      if (typeof maybeSetSpeed === 'function') {
        maybeSetSpeed(speed);
        return;
      }

      // Fallback to replayer config
      const replayer = getReplayer(playerRef);
      replayer?.setConfig?.({ speed });
    },
    isPlaying() {
      const isPlaying = () =>
        !(playerRef.current?.getReplayer?.() as unknown as { isPaused?: () => boolean })?.isPaused?.();
      return isPlaying();
    },
    reset() {
      destroyPlayer();
    },
  }));

  useEffect(() => {
    return () => {
      destroyPlayer();
    };
  }, []);

  return <div ref={containerRef} className='flex h-full w-full items-center justify-center bg-white' />;
};

export const ReplayPlayer = forwardRef(ReplayPlayerComponent);

ReplayPlayer.displayName = 'ReplayPlayer';

export default ReplayPlayer;
