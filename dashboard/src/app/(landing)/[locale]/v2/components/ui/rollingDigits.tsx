'use client';

import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { cn } from '@/landing/lib/cn';
import { EASE_OUT_EXPO } from '@/landing/lib/easing';

const ROLL_S = 0.45;

/*
 * Functions of the direction, handed down through AnimatePresence's `custom`,
 * so a leaving digit goes the way of the change that removed it rather than
 * the way it was going when last rendered.
 */
const ROLL = {
  enter: (direction: 1 | -1) => ({ y: `${100 * direction}%` }),
  settle: { y: '0%', transition: { duration: ROLL_S, ease: EASE_OUT_EXPO } },
  leave: (direction: 1 | -1) => ({
    y: `${-100 * direction}%`,
    transition: { duration: ROLL_S, ease: EASE_OUT_EXPO },
  }),
};

/**
 * Digits that roll like an odometer. Only a digit that changes moves: the old
 * one slides out of a clipped slot while the new one slides in behind it, up
 * when counting forward and down when counting back. Screen readers get the
 * value once, as text, rather than the slots.
 *
 * For readers who prefer reduced motion the digits change in place: each keeps
 * one key, so nothing rolls.
 */
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
  const inPlace = useReducedMotion() === true;
  return (
    <span className={cn('inline-flex align-bottom', className)}>
      <span className='sr-only'>{value}</span>
      {Array.from(value).map((char, i) => (
        // a clipped slot one line tall
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
