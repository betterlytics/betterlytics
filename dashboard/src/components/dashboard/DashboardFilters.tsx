'use client';

import { TimeRangeToolbar } from '@/components/TimeRange/TimeRangeToolbar';
import QueryFiltersSelector from '@/components/filters/QueryFiltersSelector';
import { ActiveQueryFilters } from '../filters/ActiveQueryFilters';
import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { QueryFiltersEditorProvider } from '@/contexts/QueryFiltersEditorProvider';

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
    <QueryFiltersEditorProvider>
      <div data-slot='dashboard-filters' className='flex min-w-0 flex-col gap-2'>
        <div className='flex min-w-0 flex-col justify-end gap-x-8 gap-y-2 sm:flex-row lg:flex-1'>
          {!isMobile && <div className='flex gap-4'>{children}</div>}
          {showQueryFilters && <QueryFiltersSelector />}
          <TimeRangeToolbar showComparison={showComparison} />
        </div>
        {isMobile && children && <div className='grid grid-cols-2 gap-2'>{children}</div>}
        {showQueryFilters && <ActiveQueryFilters />}
      </div>
    </QueryFiltersEditorProvider>
  );
}
