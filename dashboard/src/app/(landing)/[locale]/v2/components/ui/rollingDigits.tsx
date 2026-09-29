'use client';

import { AnimatePresence, m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/landing/hooks/useReducedMotion';

/**
 * Digits that roll like an odometer. Only a digit that changes moves: the old
 * one slides out of a clipped slot while the new one slides in behind it, up
 * when counting forward and down when counting back. Under reduced motion the
 * digits just change.
 */

const ROLL_S = 0.45;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/*
 * Functions of the direction, handed down through AnimatePresence's `custom`,
 * so a leaving digit goes the way of the change that removed it rather than
 * the way it was going when last rendered.
 */
const ROLL = {
  enter: (direction: 1 | -1) => ({ y: `${100 * direction}%` }),
  settle: { y: '0%', transition: { duration: ROLL_S, ease: EASE } },
  leave: (direction: 1 | -1) => ({ y: `${-100 * direction}%`, transition: { duration: ROLL_S, ease: EASE } }),
};

export function RollingDigits({
  value,
  direction = 1,
  className,
}: {
  /** Already formatted, e.g. "03". Every character gets its own slot. */
  value: string;
  direction?: 1 | -1;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{value}</span>;
  return (
    <span className={cn('rd', className)} aria-label={value}>
      {Array.from(value).map((char, i) => (
        <span key={i} className='rd__slot' aria-hidden>
          <AnimatePresence mode='popLayout' initial={false} custom={direction}>
            <m.span
              key={char}
              className='rd__digit'
              custom={direction}
              variants={ROLL}
              initial='enter'
              animate='settle'
              exit='leave'
            >
              {char}
            </m.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
