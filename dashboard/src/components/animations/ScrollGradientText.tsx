'use client';

import { type ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

type ScrollGradientTextProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollGradientText({ children, className }: ScrollGradientTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'start 0.70'],
  });

  const backgroundPositionX = useTransform(scrollYProgress, [0, 1], ['100%', '0%']);

  if (prefersReducedMotion) {
    return <span className={cn('sgt-static', className)}>{children}</span>;
  }

  return (
    <motion.span
      ref={ref}
      className={cn('sgt-animated', className)}
      style={{ '--sgt-bg-pos-x': backgroundPositionX } as React.CSSProperties}
    >
      {children}
    </motion.span>
  );
}
