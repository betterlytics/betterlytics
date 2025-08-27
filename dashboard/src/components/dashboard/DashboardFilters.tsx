'use client';

import TimeRangeSelector from '@/components/TimeRangeSelector';
import QueryFiltersSelector from '@/components/filters/QueryFiltersSelector';
import { ActiveQueryFilters } from '../filters/ActiveQueryFilters';
import { ActiveUsersLabel } from '../sidebar/ActiveUsersLabel';

interface DashboardFiltersProps {
  showComparison?: boolean;
}

export default function DashboardFilters({ showComparison = true }: DashboardFiltersProps) {
  return (
    <div className='space-y-2'>
      <div className='flex flex-col-reverse justify-between gap-x-4 gap-y-1 md:flex-row'>
        <QueryFiltersSelector />
        <div className='flex gap-6'>
          <ActiveUsersLabel />
          <TimeRangeSelector showComparison={showComparison} />
        </div>
      </div>
      <ActiveQueryFilters />
    </div>
  );
}
