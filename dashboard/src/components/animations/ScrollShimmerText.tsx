'use client';

import { type ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

type ScrollShimmerTextProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollShimmerText({ children, className }: ScrollShimmerTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'start 0.70'],
  });

  const backgroundPositionX = useTransform(scrollYProgress, [0, 1], ['100%', '0%']);

  if (prefersReducedMotion) {
    return <span className={cn('sst-static', className)}>{children}</span>;
  }

  return (
    <motion.span
      ref={ref}
      className={cn('sst-animated', className)}
      style={{ '--sst-bg-pos-x': backgroundPositionX } as React.CSSProperties}
    >
      {children}
    </motion.span>
  );
}
