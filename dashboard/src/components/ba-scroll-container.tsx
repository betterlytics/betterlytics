'use client';

import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { cn } from '@/lib/utils';

/** Compute whether a scrollable region has content above / below the viewport. */
export function computeScrollState(args: {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
}) {
  const { scrollTop, clientHeight, scrollHeight } = args;
  return {
    canScrollUp: scrollTop > 0,
    canScrollDown: Math.ceil(scrollTop) + clientHeight < scrollHeight,
  };
}

const SCROLL_PX_PER_FRAME = 6;
const INDICATOR_HEIGHT = 18;

export type BAScrollContainerProps = ComponentProps<'div'> & {
  /**
   * Scrolls a matching element into view on first layout when the container
   * is overflowing. Runs once per mount.
   */
  scrollTo?: {
    /** CSS selector for the element to find inside the container. */
    selector: string;
    /** Call `focus({ preventScroll: true })` on the element after scrolling. */
    focus?: boolean;
    /** Forwarded to `Element.scrollIntoView`. */
    options?: ScrollIntoViewOptions;
  };
};

export function BAScrollContainer({
  children,
  className,
  style,
  ref: externalRef,
  scrollTo,
  ...props
}: BAScrollContainerProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const composedRef = useComposedRefs(scrollRef, externalRef);
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
    let hasScrolledToTarget = false;

    function update() {
      if (!el) return;
      const { canScrollUp, canScrollDown } = computeScrollState({
        scrollTop: el.scrollTop,
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
      });
      setCanScrollUp(canScrollUp);
      setCanScrollDown(canScrollDown);

      if (!hasScrolledToTarget && scrollTo && el.scrollHeight > el.clientHeight) {
        hasScrolledToTarget = true;
        const target = el.querySelector<HTMLElement>(scrollTo.selector);
        if (target) {
          setTimeout(() => {
            target.scrollIntoView(scrollTo.options);
            if (scrollTo.focus) target.focus({ preventScroll: true });
          });
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
  }, [clearTimer, scrollTo]);

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
      ref={composedRef}
      data-slot="ba-scroll-container"
      className={cn('overflow-x-hidden overflow-y-auto overscroll-contain', className)}
      style={{ ...style, scrollbarWidth: 'none', scrollPaddingBlock: INDICATOR_HEIGHT }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      {...props}
    >
      {canScrollUp && (
        <div
          aria-hidden
          data-slot="ba-scroll-container-indicator-up"
          className="bg-popover sticky top-0 z-10 flex cursor-default items-center justify-center pb-0.5"
          onPointerDown={() => startAutoScroll('up')}
          onPointerMove={() => startAutoScroll('up')}
          onPointerLeave={clearTimer}
        >
          <ChevronUpIcon className="size-4" />
        </div>
      )}
      {children}
      {canScrollDown && (
        <div
          aria-hidden
          data-slot="ba-scroll-container-indicator-down"
          className="bg-popover sticky -bottom-0.25 z-10 flex cursor-default items-center justify-center pt-0.5"
          onPointerDown={() => startAutoScroll('down')}
          onPointerMove={() => startAutoScroll('down')}
          onPointerLeave={clearTimer}
        >
          <ChevronDownIcon className="size-4" />
        </div>
      )}
    </div>
  );
}
