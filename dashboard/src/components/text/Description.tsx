'use client';

import { cn } from '@/lib/utils';
import type { ElementType, ReactNode } from 'react';

type DescriptionProps<T extends ElementType = 'p'> = {
  children: ReactNode;
  className?: string;
  as?: T;
};

/**
 * Description - For help text, empty states, and longer descriptive content.
 * Uses muted foreground with small text size.
 */
export function Description<T extends ElementType = 'p'>({ children, className, as }: DescriptionProps<T>) {
  const Component = as || 'p';
  return <Component className={cn('text-muted-foreground text-sm', className)}>{children}</Component>;
}
