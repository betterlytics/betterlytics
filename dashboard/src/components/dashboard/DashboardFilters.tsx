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
      <div className='flex flex-col justify-end gap-x-8 gap-y-2 sm:flex-row'>
        {!isMobile && <div className='flex gap-4'>{children}</div>}
        {showQueryFilters && <QueryFiltersSelector />}
        <TimeRangeToolbar showComparison={showComparison} />
      </div>
      {showQueryFilters && <ActiveQueryFilters />}
      {isMobile && <div className='grid grid-cols-2 gap-2'>{children}</div>}
    </div>
  );
}
