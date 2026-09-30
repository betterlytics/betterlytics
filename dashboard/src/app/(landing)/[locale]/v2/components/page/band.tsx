'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';
import styles from './band.module.css';

/* the pen runs this far down the viewport, so the wall is inked just before the
   reader gets there and never trails what they read */
const LEAD = 0.92;
/* the mask feathers this many px of the wall into the pen tip (the wall's mask in
   band.module.css); the pen overshoots the band by it so the last stretch is fully inked */
const FEATHER = 160;

/**
 * The page's middle band, from the demo down through pricing, with the hatched wall
 * columns running down both sides. The walls are inked downward as the reader
 * scrolls: `--ink` on each wall is how far it has been drawn. The pen is pinned to the
 * scroll position and written straight from the scroll event, so it moves in the
 * same frame as the page (any easing made it trail the scroll). Only ever grows, so
 * scrolling back up never erases anything. Once the ink reaches the band's end the
 * closing rule sweeps across. The nav reads the band's top edge (by id) to know when
 * to join the grid.
 */
export function Band({ children }: { children: ReactNode }) {
  const bandRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const band = bandRef.current;
    const walls = [leftRef.current, rightRef.current].filter((wall) => wall !== null);
    if (!band || reducedMotion) return;

    band.dataset.inking = '';
    let top = 0;
    let height = 0;
    let inked = -1; // below any reach, so the first pass always writes
    const measure = () => {
      const rect = band.getBoundingClientRect();
      top = rect.top + window.scrollY;
      height = rect.height;
    };
    const update = () => {
      const reach = Math.max(0, Math.min(height + FEATHER, window.scrollY + window.innerHeight * LEAD - top));
      if (reach <= inked) return;
      inked = reach;
      const value = `${Math.round(inked)}px`;
      for (const wall of walls) wall.style.setProperty('--ink', value);
      if (inked >= height) band.dataset.closed = '';
    };
    const remeasure = () => {
      measure();
      update();
    };

    // The band moves whenever anything above it changes height (fonts landing, the
    // hero reflowing), so re-measure on any change to the page's size, not just once.
    const resizes = new ResizeObserver(remeasure);
    resizes.observe(document.documentElement);
    resizes.observe(band);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', remeasure, { passive: true });
    return () => {
      resizes.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', remeasure);
      for (const wall of walls) wall.style.removeProperty('--ink');
      delete band.dataset.inking;
      delete band.dataset.closed;
    };
  }, [reducedMotion]);

  return (
    <div ref={bandRef} id={IDS.band} className={styles.band}>
      <div ref={leftRef} className={cn(styles.wall, styles.left, 'bg-hatch')} aria-hidden />
      <div ref={rightRef} className={cn(styles.wall, styles.right, 'bg-hatch')} aria-hidden />
      {children}
    </div>
  );
}
