'use client';

import TimeRangeSelector from '@/components/TimeRangeSelector';
import QueryFiltersSelector from '@/components/filters/QueryFiltersSelector';
import { ActiveQueryFilters } from '../filters/ActiveQueryFilters';

interface DashboardFiltersProps {
  showComparison?: boolean;
}

export default function DashboardFilters({ showComparison = true }: DashboardFiltersProps) {
  return (
    <div className='space-y-2'>
      <div className='flex flex-col justify-end gap-x-4 gap-y-1 md:flex-row'>
        <QueryFiltersSelector />
        <TimeRangeSelector showComparison={showComparison} />
      </div>
      <ActiveQueryFilters />
    </div>
  );
}
