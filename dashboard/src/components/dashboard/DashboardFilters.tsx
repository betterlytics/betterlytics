'use client';

import TimeRangeSelector from '@/components/TimeRangeSelector';
import QueryFiltersSelector from '@/components/filters/QueryFiltersSelector';
import { ActiveQueryFilters } from '../filters/ActiveQueryFilters';
import { ActiveUsersLabel } from '../sidebar/ActiveUsersLabel';
import { ReactNode } from 'react';

interface DashboardFiltersProps {
  showComparison?: boolean;
  children?: ReactNode;
}

export default function DashboardFilters({ children, showComparison = true }: DashboardFiltersProps) {
  return (
    <div className='space-y-2'>
      <div className='flex flex-col-reverse justify-between gap-x-4 gap-y-1 md:flex-row'>
        <QueryFiltersSelector />
        <div className='flex gap-6'>
          {children}
          <TimeRangeSelector showComparison={showComparison} />
        </div>
      </div>
      <ActiveQueryFilters />
    </div>
  );
}
