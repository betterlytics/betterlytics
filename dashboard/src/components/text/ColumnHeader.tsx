'use client';

import { cn } from '@/lib/utils';
import type { ElementType, ReactNode } from 'react';

type ColumnHeaderProps<T extends ElementType = 'span'> = {
  children: ReactNode;
  className?: string;
  as?: T;
};

/**
 * ColumnHeader - For table column headers and data labels.
 * Uses muted foreground with uppercase, wide tracking, and semibold weight.
 */
export function ColumnHeader<T extends ElementType = 'span'>({ children, className, as }: ColumnHeaderProps<T>) {
  const Component = as || 'span';
  return (
    <Component className={cn('text-muted-foreground text-xs font-semibold tracking-wide uppercase', className)}>
      {children}
    </Component>
  );
}
