'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';
import styles from './band.module.css';

/* pen position as a viewport fraction, so the wall is inked before the reader arrives */
const LEAD = 0.92;
/* must match the mask feather in band.module.css; the pen overshoots by it to ink the end fully */
const FEATHER = 160;

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

    // fonts or hero reflow above the band move it, so watch the whole document
    const resizes = new ResizeObserver(remeasure);
    resizes.observe(document.documentElement);
    resizes.observe(band);
    // written straight from the scroll event: any easing made the pen trail the page
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
