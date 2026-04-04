'use client';

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ScrollIndicatorsProps = {
  children: ReactNode;
  className?: string;
  scrollToKey?: string;
};

const SCROLL_PX_PER_FRAME = 3;

export function ScrollIndicators({ children, className, scrollToKey }: ScrollIndicatorsProps) {
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

    function update() {
      if (!el) return;
      setCanScrollUp(el.scrollTop > 0);
      setCanScrollDown(Math.ceil(el.scrollTop) + el.clientHeight < el.scrollHeight);
    }

    if (scrollToKey) {
      const target = el.querySelector(`[data-scroll-key="${scrollToKey}"]`);
      target?.scrollIntoView({ block: 'center' });
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
      scrollRef.current?.scrollBy({ top: step });
      rafId.current = requestAnimationFrame(tick);
    }
    rafId.current = requestAnimationFrame(tick);
  }

  return (
    <>
      {canScrollUp ? (
        <div
          aria-hidden
          className='flex shrink-0 cursor-default items-center justify-center py-1'
          onPointerDown={() => startAutoScroll('up')}
          onPointerMove={() => startAutoScroll('up')}
          onPointerLeave={clearTimer}
        >
          <ChevronUpIcon className='size-4' />
        </div>
      ) : null}
      <div ref={scrollRef} className={cn('overflow-y-auto', className)}>
        {children}
      </div>
      {canScrollDown ? (
        <div
          aria-hidden
          className='flex shrink-0 cursor-default items-center justify-center py-1'
          onPointerDown={() => startAutoScroll('down')}
          onPointerMove={() => startAutoScroll('down')}
          onPointerLeave={clearTimer}
        >
          <ChevronDownIcon className='size-4' />
        </div>
      ) : null}
    </>
  );
}
