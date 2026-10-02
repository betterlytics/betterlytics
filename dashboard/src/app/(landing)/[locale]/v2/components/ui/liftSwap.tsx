'use client';

import type { ElementType, ReactNode } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { cn } from '@/landing/lib/cn';
import { EASE_OUT_EXPO } from '@/landing/lib/easing';

export const LIFT_STEP_S = 0.04; // stagger between slots
const IN_S = 0.5;
const OUT_S = 0.26;
const LIFT = 10;
const BLUR = 'blur(5px)';

type Swap = { direction: 1 | -1; delay: number };

// functions of AnimatePresence's `custom`, so leaving content follows the latest change's direction
const SWAP = {
  enter: ({ direction }: Swap) => ({ opacity: 0, y: LIFT * direction, filter: BLUR }),
  settle: ({ delay }: Swap) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    // even blur(0) renders text through a filter surface, which softens it
    transitionEnd: { filter: 'none' },
    transition: { duration: IN_S, ease: EASE_OUT_EXPO, delay },
  }),
  leave: ({ direction, delay }: Swap) => ({
    opacity: 0,
    y: -LIFT * direction,
    filter: BLUR,
    transition: { duration: OUT_S, ease: EASE_OUT_EXPO, delay },
  }),
};

/** Swaps content with a blurred lift when `id` changes; `direction` 1 rises from below. */
export function LiftSwap({
  id,
  direction = 1,
  delay = 0,
  as: Tag = 'div',
  className,
  children,
}: {
  id: string;
  direction?: 1 | -1;
  delay?: number;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  const inPlace = useReducedMotion() === true;
  const swap: Swap = { direction, delay };
  return (
    <Tag className={cn('relative', className)}>
      <AnimatePresence mode='popLayout' initial={false} custom={swap}>
        <m.span
          key={inPlace ? 'in-place' : id}
          className='block'
          custom={swap}
          variants={SWAP}
          initial='enter'
          animate='settle'
          exit='leave'
        >
          {children}
        </m.span>
      </AnimatePresence>
    </Tag>
  );
}
