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
  reset: () => void;
  addEventListener: <K extends PlayerEventName>(
    type: K,
    listener: (e: CustomEvent<{ payload: PlayerEventDetailMap[K] }>) => void,
  ) => void;
  removeEventListener: <K extends PlayerEventName>(
    type: K,
    listener: (e: CustomEvent<{ payload: PlayerEventDetailMap[K] }>) => void,
  ) => void;
};

type ReplayPlayerProps = {
  onReady?: () => void;
};

type PlayerEventName = 'ui-update-current-time' | 'ui-update-player-state' | 'ui-update-progress';
type PlayerEventDetailMap = {
  'ui-update-current-time': number;
  'ui-update-player-state': 'playing' | 'paused';
  'ui-update-progress': number;
};

type PlayerEventTarget = {
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
};

const ReplayPlayerComponent = ({ onReady }: ReplayPlayerProps, ref: React.ForwardedRef<ReplayPlayerHandle>) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<rrwebPlayer | null>(null);
  const listenersRef = useRef<{ type: PlayerEventName; listener: EventListener }[]>([]);

  const destroyPlayer = () => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch {}

      try {
        const target = playerRef.current as unknown as PlayerEventTarget;
        listenersRef.current.forEach(({ type, listener }) => target.removeEventListener(type, listener));
      } catch {}

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
          skipInactive: true,
        },
      });

      // Attach any previously registered listeners to the new player instance
      const target = playerRef.current as unknown as PlayerEventTarget;
      listenersRef.current.forEach(({ type, listener }) => target.addEventListener(type, listener));

      onReady?.();
    },
    appendEvents(events) {
      if (!playerRef.current || events.length === 0) {
        return;
      }
      // Use try/catch to avoid noisy console errors if player was disposed mid-loop
      try {
        events.forEach((event) => playerRef.current?.addEvent(event));
      } catch (_err) {}
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
      playerRef.current?.setSpeed(speed);
    },
    reset() {
      destroyPlayer();
    },
    addEventListener(type, listener) {
      const target = playerRef.current;
      const wrapped = listener as unknown as EventListener;
      listenersRef.current.push({ type, listener: wrapped });
      if (target) {
        (target as unknown as PlayerEventTarget).addEventListener(type, wrapped);
      }
    },
    removeEventListener(type, listener) {
      const target = playerRef.current as unknown as PlayerEventTarget | null;
      const wrapped = listener as unknown as EventListener;
      if (target) {
        target.removeEventListener(type, wrapped);
      }

      listenersRef.current = listenersRef.current.filter((l) => !(l.type === type && l.listener === wrapped));
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
