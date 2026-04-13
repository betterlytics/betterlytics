'use client';

import { useRef, type ReactNode } from 'react';
import { useScroll } from 'motion/react';
import { EventRaysOverlay } from './event-rays';

export function HeroScrollBlock({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  return (
    <div ref={containerRef} className='relative h-[300vh]'>
      <div className='sticky top-0 overflow-visible'>
        <EventRaysOverlay progress={scrollYProgress} />
        {children}
      </div>
    </div>
  );
}
