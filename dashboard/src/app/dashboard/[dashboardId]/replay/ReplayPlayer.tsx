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
  reset: () => void;
};

type ReplayPlayerProps = {
  onReady?: () => void;
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
        props: { events },
      });

      onReady?.();
    },
    appendEvents(events) {
      if (!playerRef.current || events.length === 0) {
        return;
      }
      events.forEach((event) => playerRef.current?.addEvent(event));
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
