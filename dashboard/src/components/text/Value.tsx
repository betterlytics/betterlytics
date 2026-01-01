'use client';

import { cn } from '@/lib/utils';
import type { ElementType, ReactNode } from 'react';

type ValueSize = 'sm' | 'md' | 'lg' | 'xl';

type ValueProps<T extends ElementType = 'span'> = {
  children: ReactNode;
  className?: string;
  as?: T;
  size?: ValueSize;
};

const sizeClasses: Record<ValueSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

/**
 * Value - For metric values and numeric data.
 * Uses foreground color with semibold weight and tabular-nums for alignment.
 */
export function Value<T extends ElementType = 'span'>({ children, className, as, size = 'md' }: ValueProps<T>) {
  const Component = as || 'span';
  return (
    <Component className={cn('text-foreground font-semibold tabular-nums', sizeClasses[size], className)}>
      {children}
    </Component>
  );
}
