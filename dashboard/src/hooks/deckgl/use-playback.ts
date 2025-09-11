import { PlaybackSpeed } from '@/components/map/deckgl/controls/PlaybackSpeedDropdown';
import { useEffect, useRef, useState } from 'react';

export function usePlayback({ frameCount, speed = 1 }: { frameCount: number; speed?: number }) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0); // float position

  useEffect(() => {
    if (!playing) return;

    let raf: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - lastTime;
      if (elapsed >= 1000 / speed) {
        setPosition((prev) => (prev + 1) % frameCount);
        lastTime = now;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, frameCount]);

  const stop = () => {
    setPlaying(false);
    setPosition((prev) => prev); // snap to whole frame
  };

  const scrub = (idx: number) => {
    setPlaying(false);
    setPosition(idx);
  };

  return {
    position,
    frame: position,
    playing,
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    toggle: () => setPlaying((p) => !p),
    stop,
    scrub,
    setSpeed: (s: PlaybackSpeed) => {}, // can still lift up if needed
  };
}
