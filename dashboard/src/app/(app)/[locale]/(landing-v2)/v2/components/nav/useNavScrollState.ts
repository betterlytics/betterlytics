import { useEffect, useState, type RefObject } from 'react';

const RETIRE_AFTER_PX = 40;

/**
 * `min` once the page has moved at all; `grid` once the nav has scrolled past
 * the top of the element with `gridStartId`, measured from the DOM so it stays
 * right if the hero's height changes.
 */
export function useNavScrollState(navRef: RefObject<HTMLElement | null>, gridStartId: string) {
  const [min, setMin] = useState(false);
  const [grid, setGrid] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    const gridStart = document.getElementById(gridStartId);
    if (!nav || !gridStart) return;
    let trigger = 0;
    let ticking = false;
    const measure = () => {
      trigger = gridStart.getBoundingClientRect().top + window.scrollY - nav.offsetHeight;
    };
    const update = () => {
      setMin(window.scrollY > RETIRE_AFTER_PX);
      setGrid(window.scrollY >= trigger);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };
    const onResize = () => {
      measure();
      update();
    };
    onResize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('load', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onResize);
    };
  }, [navRef, gridStartId]);

  return { min, grid };
}
