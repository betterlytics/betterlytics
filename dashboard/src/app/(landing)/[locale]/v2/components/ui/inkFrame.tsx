'use client';

import { useRef, type ReactNode } from 'react';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import styles from './inkFrame.module.css';

/**
 * A framed block whose rules are drawn as the reader arrives: the top edge left to
 * right, the bottom edge after it, corner squares popping where the pen lands and
 * the rules inside inking in last. Latches on first entry and never rewinds. The
 * frame type (Panel, the journey frame) supplies the edges as ::before and ::after.
 */
export function InkFrame({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drawn = useInView(ref, 'draw');
  return (
    <div ref={ref} className={cn(styles.frame, className)} data-drawn={drawn || undefined}>
      {children}
    </div>
  );
}
