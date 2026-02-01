'use client';

import { TimeRangeToolbar } from '@/components/TimeRange/TimeRangeToolbar';
import QueryFiltersSelector from '@/components/filters/QueryFiltersSelector';
import { ActiveQueryFilters } from '../filters/ActiveQueryFilters';
import { ReactNode, useRef, useLayoutEffect, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardFiltersProps {
  showComparison?: boolean;
  children?: ReactNode;
  showQueryFilters?: boolean;
}

export default function DashboardFilters({
  children,
  showComparison = true,
  showQueryFilters = true,
}: DashboardFiltersProps) {
  const isMobile = useIsMobile();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const filtersContainerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(300);

  const calculateAvailableWidth = useCallback(() => {
    if (!toolbarRef.current) return;
    const available = filtersContainerRef.current?.offsetWidth ?? 0;
    console.log(available);
    setAvailableWidth(Math.max(0, available));
  }, []);

  useLayoutEffect(() => {
    calculateAvailableWidth();

    if (!toolbarRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateAvailableWidth();
    });

    resizeObserver.observe(toolbarRef.current);
    return () => resizeObserver.disconnect();
  }, [calculateAvailableWidth]);

  return (
    <div className='space-y-2'>
      <div ref={toolbarRef} className='flex flex-col justify-end gap-x-8 gap-y-2 sm:flex-row sm:items-start'>
        {!isMobile && children && (
          <div className='flex shrink-0 gap-4'>
            {children}
          </div>
        )}
        {showQueryFilters && !isMobile && (
          <div className='flex min-w-0 flex-1 flex-col-reverse items-end justify-end gap-2 xl:flex-row xl:items-start'>
            <div ref={filtersContainerRef} className='flex min-w-0 w-full flex-1 justify-end'>
              <ActiveQueryFilters inline maxWidth={availableWidth} />
            </div>
            <div className='shrink-0'>
              <QueryFiltersSelector />
            </div>
          </div>
        )}
        {showQueryFilters && isMobile && <QueryFiltersSelector />}
        <div className='shrink-0'>
          <TimeRangeToolbar showComparison={showComparison} />
        </div>
      </div>
      {showQueryFilters && isMobile && <ActiveQueryFilters />}
      {isMobile && <div className='grid grid-cols-2 gap-2'>{children}</div>}
    </div>
  );
}
