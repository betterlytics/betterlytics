'use client';

import { cn } from '@/lib/utils';
import type { ElementType, ReactNode } from 'react';

type CaptionProps<T extends ElementType = 'span'> = {
  children: ReactNode;
  className?: string;
  as?: T;
};

/**
 * Caption - For secondary info, timestamps, and supporting text.
 * Uses muted foreground with extra-small text size.
 */
export function Caption<T extends ElementType = 'span'>({ children, className, as }: CaptionProps<T>) {
  const Component = as || 'span';
  return <Component className={cn('text-muted-foreground text-xs', className)}>{children}</Component>;
}
