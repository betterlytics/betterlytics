'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useInView } from '@/landing/hooks/useInView';

/** A box that takes `in` once scrolled into view, so CSS can play its entrance. */
export function InView({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return (
    <div ref={ref} className={cn(className, inView && 'in')}>
      {children}
    </div>
  );
}
