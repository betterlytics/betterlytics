'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type GapSize = 'none' | 'tight' | 'list' | 'card' | 'section' | 'page';

type StackProps = {
  children: ReactNode;
  /** Gap between children. Default: 'section' */
  gap?: GapSize;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'ul' | 'ol';
};

const gapClasses: Record<GapSize, string> = {
  none: 'gap-0',
  tight: 'gap-tight',
  list: 'gap-list',
  card: 'gap-card',
  section: 'gap-section',
  page: 'gap-page',
};

/**
 * Stack - Vertical layout component for stacking children with consistent spacing.
 *
 * @example
 * <Stack gap="section">
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </Stack>
 */
export function Stack({ children, gap = 'section', className, as: Component = 'div' }: StackProps) {
  return <Component className={cn('flex flex-col', gapClasses[gap], className)}>{children}</Component>;
}
