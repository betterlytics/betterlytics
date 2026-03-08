'use client';

import { type ReactNode, createContext, useContext, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const RevealedContext = createContext(false);

export function useRevealed() {
  return useContext(RevealedContext);
}

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 24,
  duration = 0.5,
  threshold = 0.15,
  once = true,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(prefersReducedMotion ?? false);

  if (prefersReducedMotion) {
    return (
      <RevealedContext value={true}>
        <div className={className}>{children}</div>
      </RevealedContext>
    );
  }

  return (
    <RevealedContext value={revealed}>
      <motion.div
        className={className}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once, amount: threshold }}
        transition={{
          duration,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        onAnimationComplete={() => setRevealed(true)}
      >
        {children}
      </motion.div>
    </RevealedContext>
  );
}
