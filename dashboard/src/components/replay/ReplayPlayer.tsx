'use client';

import { useEffect, useRef } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import type { eventWithTime } from '@rrweb/types';

type ReplayPlayerProps = {
  events: eventWithTime[];
};

export function ReplayPlayer({ events }: ReplayPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || events.length === 0) {
      return undefined;
    }

    containerRef.current.innerHTML = '';

    const instance = new rrwebPlayer({
      target: containerRef.current,
      props: { events },
    });

    return () => {
      const maybeDestroy = instance as unknown as { destroy?: () => void };
      maybeDestroy.destroy?.();
    };
  }, [events]);

  return <div ref={containerRef} className='h-[480px] w-full bg-white' />;
}
