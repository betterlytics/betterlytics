'use client';

import { cn } from '@/lib/utils';
import { Inline } from './Inline';

type StackProps = React.ComponentProps<typeof Inline>;

/**
 * Stack - Vertical layout component for stacking children with consistent spacing.
 *
 * Use gap `layout-*` for layout spacing and `content-*` for content spacing.
 *
 * @example
 * <Stack gap="layout-xl">
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </Stack>
 */
export function Stack({ children, className, ...props }: StackProps) {
  return (
    <Inline {...props} className={cn('flex-col', className)}>
      {children}
    </Inline>
  );
}
