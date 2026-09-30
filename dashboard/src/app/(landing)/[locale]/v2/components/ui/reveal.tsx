'use client';

import { useRef, type ReactNode } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import styles from './reveal.module.css';

/** Lifts into place when scrolled into view. Siblings stagger by `index`. */
export function Reveal({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return (
    <div
      ref={ref}
      className={cn(styles.reveal, className)}
      data-in={inView || undefined}
      style={vars({ '--stagger': Math.min(index, 6) })}
    >
      {children}
    </div>
  );
}

/** Quick off the mark, easing out as the pen lifts. */
const PEN: [number, number, number, number] = [0.5, 0, 0.2, 1];

/**
 * Headline emphasis: an ink stroke drawn under the word once the reader is looking
 * at it (the `read` trigger, well up the viewport, so the pen moves while the line
 * is being read). The stroke stays invisible until then, so no cap of the undrawn
 * dash shows. Reduced motion draws it at once.
 */
export function Underline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, 'read');
  // MotionConfig only stills transforms, and this is a path length
  const reduce = useReducedMotion();
  return (
    <span ref={ref} className='relative whitespace-nowrap'>
      {children}
      <svg
        className='pointer-events-none absolute -bottom-[0.02em] -left-[0.02em] h-[0.16em] w-[calc(100%+0.04em)] overflow-visible'
        viewBox='0 0 100 8'
        preserveAspectRatio='none'
        aria-hidden
      >
        <m.path
          d='M1 5.5 Q50 2.2 99 5'
          className='fill-none stroke-volt-lift stroke-3 [stroke-linecap:round]'
          initial={false}
          animate={{ pathLength: inView ? 1 : 0, opacity: inView ? 1 : 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : { pathLength: { duration: 0.75, ease: PEN, delay: 0.1 }, opacity: { duration: 0.01, delay: 0.1 } }
          }
        />
      </svg>
    </span>
  );
}
