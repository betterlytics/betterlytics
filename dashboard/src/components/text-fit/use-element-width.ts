import { useState, type RefObject } from 'react';

import { subscribeWidth } from '@/components/text-fit/resize-store';
import { useIsomorphicLayoutEffect } from '@/components/text-fit/use-isomorphic-layout-effect';

export function useElementWidth(ref: RefObject<HTMLElement | null>): number | undefined {
  const [width, setWidth] = useState<number>();
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    return subscribeWidth(el, (next) => setWidth((prev) => (prev === next ? prev : next)));
  }, [ref]);
  return width;
}
