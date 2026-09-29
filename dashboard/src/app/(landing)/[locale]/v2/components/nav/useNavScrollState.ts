import { useEffect, useState, type RefObject } from 'react';

/**
 * `grid` once the nav has scrolled past the top of the element with
 * `gridStartId`, measured from the DOM so it stays right if the hero's height
 * changes. That is where the wall begins and the rule under the bar lands.
 */
export function useNavScrollState(navRef: RefObject<HTMLElement | null>, gridStartId: string) {
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
    const update = () => setGrid(window.scrollY >= trigger);
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

  return { grid };
}
