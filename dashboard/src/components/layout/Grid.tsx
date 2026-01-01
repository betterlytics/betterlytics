'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type GapSize = 'none' | 'tight' | 'list' | 'card' | 'section' | 'page';
type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type ResponsiveColumns = {
  /** Base/mobile columns. Default: 1 */
  base?: ColumnCount;
  /** Small breakpoint (sm: 640px) */
  sm?: ColumnCount;
  /** Medium breakpoint (md: 768px) */
  md?: ColumnCount;
  /** Large breakpoint (lg: 1024px) */
  lg?: ColumnCount;
  /** Extra large breakpoint (xl: 1280px) */
  xl?: ColumnCount;
  /** 2XL breakpoint (2xl: 1536px) */
  '2xl'?: ColumnCount;
};

type GridProps = {
  children: ReactNode;
  /** Number of columns at each breakpoint */
  cols?: ColumnCount | ResponsiveColumns;
  /** Gap between items. Default: 'section' */
  gap?: GapSize;
  className?: string;
};

const gapClasses: Record<GapSize, string> = {
  none: 'gap-0',
  tight: 'gap-tight',
  list: 'gap-list',
  card: 'gap-card',
  section: 'gap-section',
  page: 'gap-page',
};

const colClasses: Record<ColumnCount, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
};

const smColClasses: Record<ColumnCount, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
  7: 'sm:grid-cols-7',
  8: 'sm:grid-cols-8',
};

const mdColClasses: Record<ColumnCount, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
  7: 'md:grid-cols-7',
  8: 'md:grid-cols-8',
};

const lgColClasses: Record<ColumnCount, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
  7: 'lg:grid-cols-7',
  8: 'lg:grid-cols-8',
};

const xlColClasses: Record<ColumnCount, string> = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
  6: 'xl:grid-cols-6',
  7: 'xl:grid-cols-7',
  8: 'xl:grid-cols-8',
};

const xxlColClasses: Record<ColumnCount, string> = {
  1: '2xl:grid-cols-1',
  2: '2xl:grid-cols-2',
  3: '2xl:grid-cols-3',
  4: '2xl:grid-cols-4',
  5: '2xl:grid-cols-5',
  6: '2xl:grid-cols-6',
  7: '2xl:grid-cols-7',
  8: '2xl:grid-cols-8',
};

function getColumnClasses(cols: ColumnCount | ResponsiveColumns): string {
  if (typeof cols === 'number') {
    return colClasses[cols];
  }

  const classes: string[] = [];
  if (cols.base) classes.push(colClasses[cols.base]);
  else classes.push(colClasses[1]); // Default to 1 column
  if (cols.sm) classes.push(smColClasses[cols.sm]);
  if (cols.md) classes.push(mdColClasses[cols.md]);
  if (cols.lg) classes.push(lgColClasses[cols.lg]);
  if (cols.xl) classes.push(xlColClasses[cols.xl]);
  if (cols['2xl']) classes.push(xxlColClasses[cols['2xl']]);

  return classes.join(' ');
}

/**
 * Grid - Responsive grid layout component.
 *
 * @example
 * // Simple 2-column grid
 * <Grid cols={2} gap="section">
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </Grid>
 *
 * @example
 * // Responsive columns
 * <Grid cols={{ base: 1, md: 2, xl: 3 }} gap="section">
 *   <Card>...</Card>
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </Grid>
 */
export function Grid({ children, cols = 1, gap = 'section', className }: GridProps) {
  return <div className={cn('grid', getColumnClasses(cols), gapClasses[gap], className)}>{children}</div>;
}
