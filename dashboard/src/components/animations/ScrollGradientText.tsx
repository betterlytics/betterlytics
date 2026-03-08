'use client';

import { type ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { useRevealed } from './ScrollReveal';

type ScrollGradientTextProps = {
  children: ReactNode;
  className?: string;
};

const gradientStyle = {
  backgroundImage: 'linear-gradient(90deg, var(--text-gradient))',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
} as const;

export function ScrollGradientText({ children, className }: ScrollGradientTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const revealed = useRevealed();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.95', 'start 0.7'],
  });

  const backgroundPositionX = useTransform(scrollYProgress, [0, 1], ['100%', '0%']);

  if (prefersReducedMotion) {
    return (
      <span className={className} style={gradientStyle}>
        {children}
      </span>
    );
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      style={
        revealed
          ? {
              backgroundImage:
                'linear-gradient(90deg, var(--text-gradient-blue), var(--text-gradient-purple), var(--text-gradient-red), var(--text-gradient-amber) 50%, var(--text-gradient-base) 50%)',
              backgroundSize: '200% 100%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundPositionX,
              backgroundPositionY: '0%',
            }
          : undefined
      }
    >
      {children}
    </motion.span>
  );
}
