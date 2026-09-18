'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useInView } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useInView';
import { IDS } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/ids';

/**
 * A framed block whose rules are drawn on entry: the top edge left to right,
 * the bottom edge after it, corner squares popping where the pen lands and the
 * inner grid inking in last. Latches on first entry and never rewinds. The
 * trigger sits well up the viewport so the pen moves while the block is being
 * read, not before it arrives. Motion is all CSS on `.ink`; this only adds the class.
 */
export function InkFrame({
  as: Tag = 'div',
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const drawn = useInView(ref, { threshold: 0, rootMargin: '0px 0px -22% 0px' });
  return (
    <Tag ref={ref} className={cn('ink', drawn && 'is-drawn', className)}>
      {children}
    </Tag>
  );
}

/* the pen runs this far ahead of the bottom of the viewport, so the wall is
   inked just before the reader gets there and never trails what they read */
const LEAD = 0.92;
/* the mask feathers this much of the wall into the pen tip (kept in step with the
   wall rule in landing-v2.css); the pen overshoots the band by it so the tip runs
   off the end and the last stretch of wall is fully inked */
const FEATHER = 160;

/**
 * Inks the band's wall columns downward as the reader scrolls: `--ink` on each
 * wall is how far down it has been drawn, in px, and the wall's mask reads it.
 * The pen is pinned to the scroll position and written straight from the scroll
 * event, so it moves in the same frame as the page: any easing here (a CSS
 * transition or a follower loop) made the pen trail the scroll and read as
 * reacting late. The feathered tip carries the drawing feel. Only ever grows,
 * so scrolling back up never erases anything. Written on the walls themselves
 * (not the band) so an update never invalidates the band's subtree. Marks the
 * band `is-inking` while running and `is-closed` once the ink reaches its end;
 * without JS the CSS defaults leave the wall and the closing rule fully drawn.
 */
export function WallInk() {
  useEffect(() => {
    const band = document.getElementById(IDS.band);
    if (!band) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const walls = Array.from(band.querySelectorAll<HTMLElement>('.wall'));
    band.classList.add('is-inking');
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
      const value = `${inked.toFixed(0)}px`;
      for (const wall of walls) wall.style.setProperty('--ink', value);
      if (inked >= height) band.classList.add('is-closed');
    };
    const onResize = () => {
      measure();
      update();
    };
    onResize();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('load', onResize);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onResize);
      for (const wall of walls) wall.style.removeProperty('--ink');
      band.classList.remove('is-inking', 'is-closed');
    };
  }, []);
  return null;
}
