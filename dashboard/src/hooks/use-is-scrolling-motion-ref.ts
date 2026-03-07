'use client';

import { useRef, type RefObject } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';

type UseIsScrollingMotionRefOptions = {
  container?: RefObject<HTMLElement | null>;
  debounceMs?: number;
};

export function useIsScrollingMotionRef({ container, debounceMs = 150 }: UseIsScrollingMotionRefOptions = {}) {
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { scrollY } = useScroll({ container });

  useMotionValueEvent(scrollY, 'change', () => {
    isScrollingRef.current = true;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, debounceMs);
  });

  return isScrollingRef;
}
