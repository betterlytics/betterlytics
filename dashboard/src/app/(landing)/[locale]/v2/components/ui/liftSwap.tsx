'use client';

import type { ElementType, ReactNode } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { cn } from '@/landing/lib/cn';
import { EASE_OUT_EXPO } from '@/landing/lib/easing';

export const LIFT_STEP_S = 0.04; // the stagger between one slot and the next
const IN_S = 0.5;
const OUT_S = 0.26;
const LIFT = 10; // px
const BLUR = 'blur(5px)';

type Swap = { direction: 1 | -1; delay: number };

/*
 * Functions of the swap, handed down through AnimatePresence's `custom`, so the
 * leaving content goes the way of the change that removed it rather than the
 * way it was going when last rendered.
 */
const SWAP = {
  enter: ({ direction }: Swap) => ({ opacity: 0, y: LIFT * direction, filter: BLUR }),
  settle: ({ delay }: Swap) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    // at rest the filter goes: even a zero blur renders text through a filter surface, which softens it
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

/**
 * A slot whose content blurs and lifts out when `id` changes while the new
 * content blurs in from the other side. `direction` says which way: 1 when the
 * reader moves forward (new content rises from below), -1 when they go back.
 * `delay` staggers several slots into one coordinated move. The leaving content
 * is popped out of flow, so the slot is positioned for it to sit in.
 *
 * For readers who prefer reduced motion the content is swapped in place: the
 * item keeps one key, so nothing enters or leaves.
 */
export function LiftSwap({
  id,
  direction = 1,
  delay = 0,
  as: Tag = 'div',
  className,
  children,
}: {
  /** Identity of the content; a change plays the swap. */
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
