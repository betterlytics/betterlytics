'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { DotGrid } from '@/components/animations/DotGrid';

type Framework = {
  name: string;
  logo: string;
  brandColor: string;
};

export function FrameworkCard({ framework }: { framework: Framework }) {
  const [isActive, setIsActive] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="group relative flex min-w-[120px] flex-shrink-0 flex-col items-center justify-center rounded-lg border border-transparent p-6 transition-[border-color,background-color] duration-300 hover:border-border hover:bg-card focus-within:border-border focus-within:bg-card"
      onHoverStart={() => setIsActive(true)}
      onHoverEnd={() => setIsActive(false)}
      onFocus={() => setIsActive(true)}
      onBlur={() => setIsActive(false)}
    >
      {/* Layer 1: Dot grid canvas */}
      <DotGrid
        color={framework.brandColor}
        active={isActive}
        gap={12}
        dotRadius={1}
        className="absolute inset-0 overflow-hidden rounded-lg"
      />

      {/* Layer 2: Gradient overlay to keep logo readable */}
      {/* Layer 2: Gradient overlay to keep logo readable */}
      <div
        className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t to-transparent to-[70%] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ '--tw-gradient-from': 'var(--dot-grid-overlay)' } as React.CSSProperties}
      />

      {/* Layer 3: Logo + label */}
      <div className="relative flex flex-col items-center">
        <motion.div
          animate={{ y: isActive ? 0 : 8 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' }}
        >
          <Image
            src={framework.logo}
            alt={`${framework.name} logo`}
            width={32}
            height={32}
            className="h-8 w-8 transition-[filter] duration-500"
            style={{
              filter: isActive ? 'none' : 'grayscale(1) brightness(0.7)',
            }}
          />
        </motion.div>

        <motion.span
          className="mt-2 text-center text-sm font-medium"
          animate={{ opacity: isActive ? 1 : 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.3, delay: isActive ? 0.075 : 0 }
          }
        >
          {framework.name}
        </motion.span>
      </div>
    </motion.div>
  );
}
