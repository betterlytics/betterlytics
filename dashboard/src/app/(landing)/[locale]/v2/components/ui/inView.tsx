'use client';

import { useRef, type ComponentPropsWithoutRef } from 'react';
import { useInView } from '@/landing/hooks/useInView';

/**
 * A box that tells its CSS where the reader is: `data-in` from the moment it
 * scrolls into view, for an entrance that plays once, and `data-live` while any of
 * it is on screen, for a loop that should rest while the reader is elsewhere.
 */
export function InView(props: ComponentPropsWithoutRef<'div'>) {
  const ref = useRef<HTMLDivElement>(null);
  const entered = useInView(ref);
  const onScreen = useInView(ref, 'onScreen');
  return <div {...props} ref={ref} data-in={entered || undefined} data-live={onScreen || undefined} />;
}
