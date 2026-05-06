'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';
import { Card } from './ui/card';

type LazySectionProps = {
  children: ReactNode;
  fallback: ReactNode;
};

export function LazySection({ children, fallback }: LazySectionProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: '100px', threshold: 0 });
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (inView && !hasBeenVisible) {
      setHasBeenVisible(true);
    }
  }, [inView, hasBeenVisible]);

  return <div ref={ref}>{hasBeenVisible ? children : fallback}</div>;
}
