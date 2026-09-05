'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useInView } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useInView';

/** Lifts into place when scrolled into view. Siblings stagger by `index`. */
export function Reveal({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const style: CSSProperties = { transitionDelay: `${Math.min(index, 6) * 55}ms` };
  return (
    <div ref={ref} className={cn('rv', inView && 'in', className)} style={style}>
      {children}
    </div>
  );
}

/** Headline emphasis: the underline draws in on scroll. */
export function Underline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  return (
    <span ref={ref} className={cn('u', inView && 'in')}>
      {children}
    </span>
  );
}
