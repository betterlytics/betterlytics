'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';

/** ms from 0 to the figure */
const DURATION = 1150;

/** The figure as the page's English copy sets it. */
function format(n: number, decimals: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * A figure that counts up from 0 once scrolled into view, easing out as it lands;
 * under reduced motion it shows the figure at once. Each frame is written straight
 * to the DOM, so nothing re-renders while it counts, and screen readers get only
 * the settled figure.
 */
export function CountUp({
  value,
  decimals = 0,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const wholeRef = useRef<HTMLSpanElement>(null);
  const fractionRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();

  useEffect(() => {
    const show = (n: number) => {
      const [whole, fraction = ''] = format(n, decimals).split('.');
      if (wholeRef.current) wholeRef.current.textContent = whole;
      if (fractionRef.current) fractionRef.current.textContent = fraction;
    };
    if (reduce) {
      show(value);
      return;
    }
    if (!inView) return;
    let raf = 0;
    let t0: number | null = null;
    const step = (ts: number) => {
      t0 ??= ts;
      const p = Math.min((ts - t0) / DURATION, 1);
      show(value * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, value, decimals]);

  const [whole, fraction] = format(0, decimals).split('.');
  return (
    <b ref={ref} className={cn('tabular-nums', className)}>
      <span className='sr-only'>{format(value, decimals)}</span>
      <span aria-hidden>
        <span ref={wholeRef}>{whole}</span>
        {fraction === undefined ? null : (
          <>
            {/* tabular digits keep the count from jittering, but the face gives the point a
                full figure width too, so the point is set proportionally on its own */}
            <span className='normal-nums'>.</span>
            <span ref={fractionRef}>{fraction}</span>
          </>
        )}
      </span>
    </b>
  );
}
