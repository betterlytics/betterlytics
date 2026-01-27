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
  const testRef = useRef<HTMLDivElement>(null);
  const filterSelectorRef = useRef<HTMLDivElement>(null);
  const timeToolbarRef = useRef<HTMLDivElement>(null);
  const childrenRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(300);

  const calculateAvailableWidth = useCallback(() => {
    if (!toolbarRef.current) return;

    // const toolbarWidth = toolbarRef.current.offsetWidth;
    // const filterSelectorWidth = filterSelectorRef.current?.offsetWidth ?? 0;
    // const timeToolbarWidth = timeToolbarRef.current?.offsetWidth ?? 0;
    // const childrenWidth = childrenRef.current?.offsetWidth ?? 0;
    // const gaps = 8 + 8 + 32; // gap-2 between badges+selector, gap-x-8 between groups
    // const available = toolbarWidth - filterSelectorWidth - timeToolbarWidth - childrenWidth - gaps;

    const available = testRef.current?.offsetWidth ?? 0;
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
          <div ref={childrenRef} className='flex shrink-0 gap-4'>
            {children}
          </div>
        )}
        {showQueryFilters && !isMobile && (
          <div className='flex flex-1 flex-col-reverse items-end justify-end gap-2 xl:flex-row xl:items-start'>
            <div ref={testRef} className='flex w-full flex-1 justify-end'>
              <ActiveQueryFilters inline maxWidth={availableWidth} />
            </div>
            <div ref={filterSelectorRef} className='shrink-0'>
              <QueryFiltersSelector />
            </div>
          </div>
        )}
        {showQueryFilters && isMobile && <QueryFiltersSelector />}
        <div ref={timeToolbarRef} className='shrink-0'>
          <TimeRangeToolbar showComparison={showComparison} />
        </div>
      </div>
      {showQueryFilters && isMobile && <ActiveQueryFilters />}
      {isMobile && <div className='grid grid-cols-2 gap-2'>{children}</div>}
    </div>
  );
}
