'use client';

import { useRef, type ReactNode } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import { EASE_INK } from '@/landing/lib/easing';
import styles from './reveal.module.css';

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

/** Hidden until drawn: an undrawn path still shows its round cap. */
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
              : {
                  pathLength: { duration: 0.75, ease: EASE_INK, delay: 0.1 },
                  opacity: { duration: 0.01, delay: 0.1 },
                }
          }
        />
      </svg>
    </span>
  );
}
