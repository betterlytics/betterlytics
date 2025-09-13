'use client';

import TimeRangeSelector from '@/components/TimeRangeSelector';
import QueryFiltersSelector from '@/components/filters/QueryFiltersSelector';
import { ActiveQueryFilters } from '../filters/ActiveQueryFilters';
import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardFiltersProps {
  showComparison?: boolean;
  children?: ReactNode;
}

export default function DashboardFilters({ children, showComparison = true }: DashboardFiltersProps) {
  const isMobile = useIsMobile();

  return (
    <div className='space-y-2'>
      <div className='flex flex-col-reverse justify-end gap-x-4 gap-y-2 sm:flex-row'>
        {!isMobile && <div className='flex gap-4'>{children}</div>}
        <QueryFiltersSelector />
        <TimeRangeSelector showComparison={showComparison} />
      </div>
      {/* {showAutoRefresh && <AutoRefresh />} */}
      <ActiveQueryFilters />
      {isMobile && <div className='grid grid-cols-2 gap-2'>{children}</div>}
    </div>
  );
}
