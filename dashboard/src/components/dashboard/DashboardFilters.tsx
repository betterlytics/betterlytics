'use client';

import { TimeRangeToolbar } from '@/components/TimeRange/TimeRangeToolbar';
import QueryFiltersSelector from '@/components/filters/QueryFiltersSelector';
import { ActiveQueryFilters } from '../filters/ActiveQueryFilters';
import { ReactNode } from 'react';
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

  return (
    <div className='space-y-2'>
      <div className='flex flex-col justify-end gap-x-8 gap-y-2 sm:flex-row sm:items-start'>
        {!isMobile && children && (
          <div className='flex shrink-0 gap-4'>
            {children}
          </div>
        )}
        {showQueryFilters && !isMobile && (
          <div className='flex flex-1 flex-col-reverse items-end justify-end gap-2 xl:flex-row xl:items-start'>
            <div className='flex min-w-0 flex-1 justify-end'>
              <ActiveQueryFilters inline />
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
