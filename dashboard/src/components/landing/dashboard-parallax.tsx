'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function DashboardParallax({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const glowScale = useTransform(scrollYProgress, [0.3, 1], [0.5, 1]);

  return (
    <div ref={ref}>
      <motion.div
        style={{ scale, y, willChange: 'transform' }}
        className='relative'
      >
        <motion.div
          className='pointer-events-none absolute -inset-x-32 -inset-y-20 -z-10 rounded-[4rem] bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.6),_rgba(59,130,246,0.2)_50%,_transparent_75%)] blur-[80px] dark:bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.8),_rgba(37,99,235,0.3)_50%,_transparent_75%)]'
          style={{ scale: glowScale, willChange: 'transform' }}
          aria-hidden
        />
        {children}
      </motion.div>
    </div>
  );
}
