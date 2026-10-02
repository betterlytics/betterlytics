'use client';

import { useRef, type ReactNode } from 'react';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import styles from './inkFrame.module.css';

/** Draws its rules in on first entry; `className` must position the ::before/::after edges. */
export function InkFrame({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drawn = useInView(ref, 'draw');
  return (
    <div ref={ref} className={cn(styles.frame, className)} data-drawn={drawn || undefined}>
      {children}
    </div>
  );
}
