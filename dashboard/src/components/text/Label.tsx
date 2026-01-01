'use client';

import { cn } from '@/lib/utils';
import type { ElementType, ReactNode } from 'react';

type LabelProps<T extends ElementType = 'span'> = {
  children: ReactNode;
  className?: string;
  as?: T;
};

/**
 * Label - For card headers, section titles, and field labels.
 * Uses muted foreground with semibold weight and wide tracking.
 */
export function Label<T extends ElementType = 'span'>({ children, className, as }: LabelProps<T>) {
  const Component = as || 'span';
  return (
    <Component className={cn('text-muted-foreground text-sm font-semibold tracking-wide', className)}>
      {children}
    </Component>
  );
}
