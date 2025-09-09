import { PlaybackSpeed } from '@/components/map/deckgl/controls/PlaybackSpeedDropdown';
import { useEffect, useRef, useState } from 'react';

export function usePlayback({ frameCount, speed = 1 }: { frameCount: number; speed?: number }) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0); // float position
  const frameRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = now;
      const elapsed = now - lastTimeRef.current;
      const newPos = position + (elapsed / 1000) * speed; // 1 frame/sec * speed
      setPosition(newPos % frameCount);
      lastTimeRef.current = now;
      requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, frameCount, position]);

  const stop = () => {
    setPlaying(false);
    setPosition(Math.floor(position)); // snap to whole frame
  };

  const scrub = (idx: number) => {
    setPlaying(false);
    setPosition(idx);
  };

  return {
    position, // float progress
    frame: Math.floor(position), // discrete
    playing,
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    toggle: () => setPlaying((p) => !p),
    stop,
    scrub,
    setSpeed: (s: PlaybackSpeed) => {}, // optionally lift to parent
  };
}
