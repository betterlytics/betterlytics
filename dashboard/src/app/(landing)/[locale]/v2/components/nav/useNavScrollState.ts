import { useEffect, useState, type RefObject } from 'react';

/** How far the page must move in one direction before the bar follows it, so a jitter doesn't flick it. */
const TOLERANCE = 8;

/**
 * `grid` once the nav has scrolled past the top of the element with
 * `gridStartId`, measured from the DOM so it stays right if the hero's height
 * changes. That is where the wall begins and the rule under the bar lands.
 * `scrolledDown` while the reader's last move was down, past the bar's own height.
 */
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
    // anything above the band (fonts landing, the hero reflowing) moves its top, and
    // the band itself resizes with the window
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
