'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { GAP_CLASSES, type GapSize, COLS_CLASSES, type ColumnCount, type ColBreakpoints } from './spacings';

type ResponsiveColumns = Partial<{
  [key in ColBreakpoints]: ColumnCount;
}>;

type GridProps = {
  children: ReactNode;
  /** Number of columns at each breakpoint */
  cols?: ColumnCount | ResponsiveColumns;
  /** Gap between items. Default: 'section' */
  gap?: GapSize;
  className?: string;
};

function getColumnClasses(cols: ColumnCount | ResponsiveColumns): string {
  if (typeof cols === 'number') {
    return COLS_CLASSES.base[cols];
  }

  return cn(
    cols.base && COLS_CLASSES.base[cols.base],
    cols.sm && COLS_CLASSES.sm[cols.sm],
    cols.md && COLS_CLASSES.md[cols.md],
    cols.lg && COLS_CLASSES.lg[cols.lg],
    cols.xl && COLS_CLASSES.xl[cols.xl],
    cols['2xl'] && COLS_CLASSES['2xl'][cols['2xl']],
  );
}

/**
 * Grid - Responsive grid layout component.
 *
 * @example
 * // Simple 2-column grid
 * <Grid cols={2} gap="content-xl">
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </Grid>
 *
 * @example
 * // Responsive columns
 * <Grid cols={{ base: 1, md: 2, xl: 3 }} gap="content-xl">
 *   <Card>...</Card>
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </Grid>
 */
export function Grid({ children, cols = 1, gap = 'content-xl', className }: GridProps) {
  return <div className={cn('grid', getColumnClasses(cols), GAP_CLASSES[gap], className)}>{children}</div>;
}
