import type { ReactNode } from 'react';
import { InView } from '@/landing/components/ui/inView';
import { cn } from '@/landing/lib/cn';
import styles from './showcase.module.css';

/** The hatched surface an illustration sits on; it crops whatever runs past its edges and marks `data-in` once seen. */
export function Stage({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <InView className={cn(styles.stage, 'bg-hatch', className)} aria-hidden data-nosnippet>
      {children}
    </InView>
  );
}
