'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/** Like the shadcn ScrollArea, but exposes the Radix viewport (ref, scroll events, className). */
function ScrollArea({
  className,
  children,
  viewportRef,
  viewportClassName,
  onViewportScroll,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  viewportRef?: React.Ref<HTMLDivElement>;
  viewportClassName?: string;
  onViewportScroll?: React.UIEventHandler<HTMLDivElement>;
}) {
  return (
    <ScrollAreaPrimitive.Root data-slot='scroll-area' className={cn('relative', className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        onScroll={onViewportScroll}
        data-slot='scroll-area-viewport'
        className={cn(
          'focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1',
          viewportClassName,
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

export { ScrollArea };
