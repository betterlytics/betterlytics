'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { cn } from '@/lib/utils';

function ScrollArea({ className, children, ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const handleWheel = React.useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const canScrollY = viewport.scrollHeight > viewport.clientHeight;
    const canScrollX = viewport.scrollWidth > viewport.clientWidth;

    // If we only have horizontal overflow (mobile layout), translate wheel Y into horizontal scroll.
    if (!canScrollY && canScrollX && event.deltaY !== 0) {
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
      return;
    }

    // Otherwise allow native vertical scroll; stop propagation so parent dialogs don't hijack the wheel.
    if (canScrollY) {
      event.stopPropagation();
    }
  }, []);

  return (
    <ScrollAreaPrimitive.Root data-slot='scroll-area' className={cn('relative', className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        data-slot='scroll-area-viewport'
        ref={viewportRef}
        onWheel={handleWheel}
        className='focus-visible:ring-ring/50 size-full overflow-auto rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1'
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot='scroll-area-scrollbar'
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none',
        orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot='scroll-area-thumb'
        className='bg-border relative flex-1 rounded-full'
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
