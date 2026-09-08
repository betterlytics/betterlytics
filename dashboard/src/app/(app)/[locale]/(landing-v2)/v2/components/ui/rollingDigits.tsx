'use client';

import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useReducedMotion';

/**
 * Digits that roll like an odometer. Only a digit that changes moves: the old
 * one slides out of a clipped slot while the new one slides in behind it, up
 * when counting forward and down when counting back. Under reduced motion the
 * digits just change.
 */

const ROLL_S = 0.45;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={char}
              className='rd__digit'
              initial={{ y: `${100 * direction}%` }}
              animate={{ y: '0%', transition: { duration: ROLL_S, ease: EASE } }}
              exit={{ y: `${-100 * direction}%`, transition: { duration: ROLL_S, ease: EASE } }}
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
