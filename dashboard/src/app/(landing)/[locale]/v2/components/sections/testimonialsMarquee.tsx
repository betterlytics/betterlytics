'use client';

import { useRef, type ReactNode } from 'react';
import { useInView } from '@/landing/hooks/useInView';
import styles from './testimonialsSection.module.css';

/** The testimonial rows' frame. A client island only to know when it is on screen: the rows drift only then. */
export function TestimonialsMarquee({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useInView(ref, 'onScreen');
  return (
    <div ref={ref} className={styles.marquee} data-live={onScreen || undefined}>
      {children}
    </div>
  );
}
