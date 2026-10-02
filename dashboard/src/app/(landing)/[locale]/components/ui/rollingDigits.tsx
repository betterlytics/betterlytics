'use client';

import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { cn } from '@/landing/lib/cn';
import { EASE_OUT_EXPO } from '@/landing/lib/easing';

const ROLL_S = 0.45;

// functions of AnimatePresence's `custom`, so a leaving digit follows the latest change's direction
const ROLL = {
  enter: (direction: 1 | -1) => ({ y: `${100 * direction}%` }),
  settle: { y: '0%', transition: { duration: ROLL_S, ease: EASE_OUT_EXPO } },
  leave: (direction: 1 | -1) => ({
    y: `${-100 * direction}%`,
    transition: { duration: ROLL_S, ease: EASE_OUT_EXPO },
  }),
};

/** Odometer digits: only changed characters roll, up when `direction` is 1. */
export function RollingDigits({
  value,
  direction = 1,
  className,
}: {
  /** Pre-formatted, e.g. "03"; one slot per character. */
  value: string;
  direction?: 1 | -1;
  className?: string;
}) {
  const inPlace = useReducedMotion() === true;
  return (
    <span className={cn('inline-flex align-bottom', className)}>
      <span className='sr-only'>{value}</span>
      {Array.from(value).map((char, i) => (
        <span key={i} className='relative inline-block h-lh overflow-hidden' aria-hidden>
          <AnimatePresence mode='popLayout' initial={false} custom={direction}>
            <m.span
              key={inPlace ? 'in-place' : char}
              className='block'
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
