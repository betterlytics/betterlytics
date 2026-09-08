'use client';

import type { ElementType, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useReducedMotion';

/**
 * A slot whose content blurs and lifts out when `id` changes while the new
 * content blurs in from the other side. `direction` says which way: 1 when the
 * reader moves forward (new content rises from below), -1 when they go back.
 * `delay` staggers several slots into one coordinated move. The leaving content
 * is popped out of flow, so the slot is positioned for it to sit in.
 *
 * Under reduced motion the content just swaps.
 */

export const LIFT_STEP_S = 0.04; // the stagger between one slot and the next
const IN_S = 0.5;
const OUT_S = 0.26;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const LIFT = 10; // px
const BLUR = 'blur(5px)';

export type LiftProps = {
  /** Identity of the content; a change plays the swap. */
  id: string;
  direction?: 1 | -1;
  delay?: number;
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

export function LiftSwap({ id, direction = 1, delay = 0, as: Tag = 'div', className, children }: LiftProps) {
  const reduce = useReducedMotion();
  if (reduce) return <Tag className={cn('ls', className)}>{children}</Tag>;
  return (
    <Tag className={cn('ls', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={id}
          className='ls__item'
          initial={{ opacity: 0, y: LIFT * direction, filter: BLUR }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: IN_S, ease: EASE, delay } }}
          exit={{
            opacity: 0,
            y: -LIFT * direction,
            filter: BLUR,
            transition: { duration: OUT_S, ease: EASE, delay },
          }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </Tag>
  );
}

/** A multi-line headline, each line its own slot, staggered top to bottom. The first line is `is-dim`. */
export function LiftLines({
  lines,
  direction,
  delay = 0,
  as: Tag = 'h3',
  className,
}: {
  lines: string[];
  direction?: 1 | -1;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <LiftSwap
          key={i}
          id={line}
          as='span'
          className={cn('ls--line', i === 0 && 'is-dim')}
          direction={direction}
          delay={delay + i * LIFT_STEP_S}
        >
          {line}
        </LiftSwap>
      ))}
    </Tag>
  );
}
