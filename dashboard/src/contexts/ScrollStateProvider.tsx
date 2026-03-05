'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

type ScrollStateContextType = {
  isScrollingRef: React.RefObject<boolean>;
};

const ScrollStateContext = createContext<ScrollStateContextType>({
  isScrollingRef: { current: false },
});

export function useIsScrollingRef() {
  return useContext(ScrollStateContext).isScrollingRef;
}

type ScrollStateProviderProps = {
  children: ReactNode;
  target?: React.RefObject<HTMLElement | null>;
  debounceMs?: number;
};

export function ScrollStateProvider({ children, target, debounceMs = 150 }: ScrollStateProviderProps) {
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const scrollTarget = target?.current ?? window;
    let timeoutId: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      isScrollingRef.current = true;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        isScrollingRef.current = false;
      }, debounceMs);
    };

    scrollTarget.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      scrollTarget.removeEventListener('scroll', onScroll);
      clearTimeout(timeoutId);
    };
  }, [target, debounceMs]);

  return <ScrollStateContext.Provider value={{ isScrollingRef }}>{children}</ScrollStateContext.Provider>;
}
