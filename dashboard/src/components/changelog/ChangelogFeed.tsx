'use client';

import { Children, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type ChangelogFeedProps = {
  children: React.ReactNode;
  initialBatchSize?: number;
  loadMoreLabel: string;
  endLabel: string;
};

export function ChangelogFeed({ children, initialBatchSize = 3, loadMoreLabel, endLabel }: ChangelogFeedProps) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const [visibleCount, setVisibleCount] = useState(() => Math.min(initialBatchSize, items.length));
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const totalCount = items.length;

  useEffect(() => {
    setVisibleCount(Math.min(initialBatchSize, items.length));
  }, [initialBatchSize, items.length]);

  useEffect(() => {
    if (!loaderRef.current || visibleCount >= totalCount) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(totalCount, prev + initialBatchSize));
        }
      },
      { rootMargin: '256px 0px' },
    );

    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [initialBatchSize, totalCount, visibleCount]);

  const isComplete = visibleCount >= totalCount;
  const statusMessage = isComplete ? endLabel : loadMoreLabel;

  return (
    <div className='space-y-12'>
      <div className='border-border/60 border-y'>
        {items.slice(0, visibleCount)}
        {visibleCount < totalCount && (
          <div
            className='border-border/60 text-muted-foreground border-t px-4 py-8 text-center text-sm'
            aria-live='polite'
          >
            {loadMoreLabel}
          </div>
        )}
      </div>
      <div
        ref={loaderRef}
        aria-hidden={isComplete}
        className={cn('flex flex-col items-center justify-center gap-3 pt-2 text-center', isComplete && 'pb-2')}
      >
        <p className='text-muted-foreground text-sm' aria-live='polite'>
          {statusMessage}
        </p>
      </div>
    </div>
  );
}
