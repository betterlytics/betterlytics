'use client';

import { useRef, type ComponentPropsWithoutRef } from 'react';
import { useInView } from '@/landing/hooks/useInView';

export function InView(props: ComponentPropsWithoutRef<'div'>) {
  const ref = useRef<HTMLDivElement>(null);
  const entered = useInView(ref);
  const onScreen = useInView(ref, 'onScreen');
  return <div {...props} ref={ref} data-in={entered || undefined} data-live={onScreen || undefined} />;
}
