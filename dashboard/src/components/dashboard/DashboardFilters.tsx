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
      <div className='flex flex-col-reverse justify-between gap-x-4 gap-y-1 md:flex-row'>
        <QueryFiltersSelector />
        {isMobile ? (
          <TimeRangeSelector showComparison={showComparison} />
        ) : (
          <div className='flex gap-4'>
            {children}
            <TimeRangeSelector showComparison={showComparison} />
          </div>
        )}
      </div>
      <ActiveQueryFilters />
      {isMobile && <div className='grid grid-cols-2 gap-2'>{children}</div>}
    </div>
  );
}
