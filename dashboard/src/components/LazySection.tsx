'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';

type LazySectionProps = {
  children: ReactNode;
};

export function LazySection({ children }: LazySectionProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: '100px', threshold: 0 });
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (inView && !hasBeenVisible) {
      setHasBeenVisible(true);
    }
  }, [inView, hasBeenVisible]);

  return <div ref={ref}>{hasBeenVisible ? children : <div className='min-h-[280px]' />}</div>;
}
