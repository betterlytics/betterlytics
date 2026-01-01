'use client';

import { cn } from '@/lib/utils';

type GapSize = 'none' | 'minimal' | 'tight' | 'list' | 'card' | 'section' | 'page';

type StackProps = {
  gap?: GapSize;
} & React.ComponentProps<'div'>;

const gapClasses: Record<GapSize, string> = {
  none: 'gap-0',
  minimal: 'gap-minimal',
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
export function Stack({ children, gap = 'section', className, ...props }: StackProps) {
  return (
    <div {...props} className={cn('flex flex-col', gapClasses[gap], className)}>
      {children}
    </div>
  );
}
