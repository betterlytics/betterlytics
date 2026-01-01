'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type GapSize = 'none' | 'tight' | 'list' | 'card' | 'section';
type Alignment = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type Justification = 'start' | 'center' | 'end' | 'between' | 'around';

type InlineProps = {
  children: ReactNode;
  /** Gap between children. Default: 'list' */
  gap?: GapSize;
  /** Vertical alignment. Default: 'center' */
  align?: Alignment;
  /** Horizontal justification. Default: 'start' */
  justify?: Justification;
  /** Allow wrapping. Default: false */
  wrap?: boolean;
  className?: string;
};

const gapClasses: Record<GapSize, string> = {
  none: 'gap-0',
  tight: 'gap-tight',
  list: 'gap-list',
  card: 'gap-card',
  section: 'gap-section',
};

const alignClasses: Record<Alignment, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

const justifyClasses: Record<Justification, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

/**
 * Inline - Horizontal layout component for inline elements with consistent spacing.
 *
 * @example
 * <Inline gap="list" align="center">
 *   <Icon />
 *   <span>Label</span>
 * </Inline>
 *
 * @example
 * <Inline justify="between">
 *   <span>Title</span>
 *   <Button>Action</Button>
 * </Inline>
 */
export function Inline({
  children,
  gap = 'list',
  align = 'center',
  justify = 'start',
  wrap = false,
  className,
}: InlineProps) {
  return (
    <div
      className={cn(
        'flex',
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className,
      )}
    >
      {children}
    </div>
  );
}
