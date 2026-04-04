'use client';

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type DropdownContentControllerProps = {
  children: ReactNode;
  className?: string;
  scrollToKey?: string;
};

const SCROLL_PX_PER_FRAME = 3;
const INDICATOR_HEIGHT = 28;

export function DropdownContentController({ children, className, scrollToKey }: DropdownContentControllerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const rafId = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let hasScrolledToKey = false;

    function update() {
      if (!el) return;
      setCanScrollUp(el.scrollTop > 0);
      setCanScrollDown(Math.ceil(el.scrollTop) + el.clientHeight < el.scrollHeight);

      if (!hasScrolledToKey && scrollToKey && el.scrollHeight > el.clientHeight) {
        hasScrolledToKey = true;
        const target = el.querySelector<HTMLElement>(`[data-scroll-key="${scrollToKey}"]`);
        if (target) {
          target.scrollIntoView({ block: 'nearest' });
          target.focus({ preventScroll: true });
        }
      }
    }

    update();
    el.addEventListener('scroll', update, { passive: true });

    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
      clearTimer();
    };
  }, [clearTimer, scrollToKey]);

  function startAutoScroll(direction: 'up' | 'down') {
    if (rafId.current !== null) return;
    const step = direction === 'up' ? -SCROLL_PX_PER_FRAME : SCROLL_PX_PER_FRAME;
    function tick() {
      if (!scrollRef.current) return clearTimer();
      const prev = scrollRef.current.scrollTop;
      scrollRef.current.scrollBy({ top: step });
      if (scrollRef.current.scrollTop === prev) return clearTimer();
      rafId.current = requestAnimationFrame(tick);
    }
    rafId.current = requestAnimationFrame(tick);
  }

  return (
    <div
      ref={scrollRef}
      className={cn('overflow-x-hidden overflow-y-auto', className)}
      style={{ scrollbarWidth: 'none', scrollPaddingBlock: INDICATOR_HEIGHT }}
    >
      {canScrollUp && (
        <div
          aria-hidden
          className='bg-popover sticky top-0 z-10 flex cursor-default items-center justify-center py-1'
          onPointerDown={() => startAutoScroll('up')}
          onPointerMove={() => startAutoScroll('up')}
          onPointerLeave={clearTimer}
        >
          <ChevronUpIcon className='size-4' />
        </div>
      )}
      {children}
      {canScrollDown && (
        <div
          aria-hidden
          className='bg-popover sticky bottom-0 z-10 flex cursor-default items-center justify-center py-1'
          onPointerDown={() => startAutoScroll('down')}
          onPointerMove={() => startAutoScroll('down')}
          onPointerLeave={clearTimer}
        >
          <ChevronDownIcon className='size-4' />
        </div>
      )}
    </div>
  );
}
