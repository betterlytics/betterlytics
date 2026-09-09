'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useInView } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useInView';
import { useReducedMotion } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useReducedMotion';

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
  const style: CSSProperties = { transitionDelay: `${Math.min(index, 6) * 55}ms` };
  return (
    <div ref={ref} className={cn('rv', inView && 'in', className)} style={style}>
      {children}
    </div>
  );
}

/**
 * Headline emphasis: an ink stroke drawn under the word once the reader is
 * looking at it. The trigger is set well up the viewport so the pen moves
 * while the headline is being read, not before it arrives. The stroke is
 * invisible until then, so no cap of the undrawn dash can show.
 */
const PEN: [number, number, number, number] = [0.5, 0, 0.2, 1]; // quick off the mark, easing out as it lifts

export function Underline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { threshold: 0.5, rootMargin: '0px 0px -34% 0px' });
  const reduce = useReducedMotion();
  return (
    <span ref={ref} className='u'>
      {children}
      <svg className='u__ink' viewBox='0 0 100 8' preserveAspectRatio='none' aria-hidden>
        <motion.path
          d='M1 5.5 Q50 2.2 99 5'
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
