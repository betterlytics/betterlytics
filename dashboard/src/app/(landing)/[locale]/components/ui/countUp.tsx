'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { COPY_LOCALE } from '@/landing/content/copy';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';

const DURATION = 1150;

const formatter = (decimals: number) =>
  new Intl.NumberFormat(COPY_LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

function split(format: Intl.NumberFormat, n: number) {
  let whole = '';
  let point = '';
  let fraction = '';
  for (const { type, value } of format.formatToParts(n)) {
    if (type === 'decimal') point = value;
    else if (type === 'fraction') fraction = value;
    else whole += value;
  }
  return { whole, point, fraction };
}

/** Counts up once in view; frames write to the DOM directly, so nothing re-renders. */
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
    const format = formatter(decimals);
    const show = (n: number) => {
      const { whole, fraction } = split(format, n);
      if (wholeRef.current) wholeRef.current.textContent = whole;
      if (fractionRef.current) fractionRef.current.textContent = fraction;
    };
    if (reduce) {
      show(value);
      return;
    }
    if (!inView) {
      show(0);
      return;
    }
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

  const format = formatter(decimals);
  const { whole, point, fraction } = split(format, value);
  return (
    <b ref={ref} className={cn('tabular-nums', className)}>
      <span className='sr-only'>{format.format(value)}</span>
      <span aria-hidden>
        <span ref={wholeRef}>{whole}</span>
        {point && (
          <>
            {/* tabular-nums gives the point a full figure width in this face */}
            <span className='normal-nums'>{point}</span>
            <span ref={fractionRef}>{fraction}</span>
          </>
        )}
      </span>
    </b>
  );
}
