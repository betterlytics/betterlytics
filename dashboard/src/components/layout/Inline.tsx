'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import {
  GAP_CLASSES,
  type GapSize,
  ALIGN_CLASSES,
  type Alignment,
  JUSTIFY_CLASSES,
  type Justification,
} from './spacings';

type InlineProps = {
  children: ReactNode;
  /** Gap between children. Default: 'content-xl' */
  gap?: GapSize;
  /** Vertical alignment. Default: 'center' */
  align?: Alignment;
  /** Horizontal justification. Default: 'start' */
  justify?: Justification;
  /** Allow wrapping. Default: false */
  wrap?: boolean;
} & React.ComponentProps<'div'>;

/**
 * Inline - Horizontal layout component for inline elements with consistent spacing.
 *
 * Use gap `layout-*` for layout spacing and `content-*` for content spacing.
 *
 * @example
 * <Inline gap="content-xl" align="center">
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
  gap = 'content-xl',
  align = 'center',
  justify = 'start',
  wrap = false,
  className,
  ...props
}: InlineProps) {
  return (
    <div
      {...props}
      className={cn(
        'flex',
        GAP_CLASSES[gap],
        ALIGN_CLASSES[align],
        JUSTIFY_CLASSES[justify],
        wrap && 'flex-wrap',
        className,
      )}
    >
      {children}
    </div>
  );
}
