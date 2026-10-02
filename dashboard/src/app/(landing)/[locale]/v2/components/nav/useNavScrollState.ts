import { useEffect, useState, type RefObject } from 'react';

/** Min scroll (px) before `scrolledDown` flips, so jitter doesn't flick the bar. */
const TOLERANCE = 8;

/** `grid`: the nav is past `gridStartId`'s top. `scrolledDown`: the last move was down, below the bar. */
export function useNavScrollState(navRef: RefObject<HTMLElement | null>, gridStartId: string) {
  const [grid, setGrid] = useState(false);
  const [scrolledDown, setScrolledDown] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    const gridStart = document.getElementById(gridStartId);
    if (!nav || !gridStart) return;
    let trigger = 0;
    let frame = 0;
    let lastY = window.scrollY;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setGrid(y >= trigger);
      if (Math.abs(y - lastY) < TOLERANCE) return;
      setScrolledDown(y > lastY && y > nav.offsetHeight);
      lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const measure = () => {
      trigger = gridStart.getBoundingClientRect().top + window.scrollY - nav.offsetHeight;
      update();
    };
    // fonts or hero reflow above the band move its top, so watch the whole document
    const resized = new ResizeObserver(measure);
    resized.observe(document.documentElement);
    resized.observe(nav);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      resized.disconnect();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [navRef, gridStartId]);

  return { grid, scrolledDown };
}
